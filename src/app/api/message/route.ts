import { allgames, gamesDescriptions } from "@/app/(models)/DB";
import { initialPrompt, afterQueryPrompt } from "@/app/utils/prompts";
import { gameWithNameQuery, noNameQuery } from "@/app/utils/queries";
import { Message, MessageArraySchema } from "@/app/lib/validators/message";
import {
  ChatGPTMessage,
  OpenAIStream,
  OpenAIStreamPayload,
} from "@/app/lib/openai-stream";

async function getQuery(messages: ChatGPTMessage[]) {
  try {
    messages.unshift({
      role: "system",
      content: initialPrompt,
    });

    const res = await fetch(`${process.env.OPENAI_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: messages,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        n: 1,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      const responseBody = data.choices[0].message.content;
      const parsedBody = JSON.parse(responseBody);
      if (!parsedBody) {
        return "No games found";
      }
      let query = {};
      let aggregationPipeline: any[] = [];
      if (parsedBody && parsedBody[0].name) {
        query = { Name: parsedBody[0].name };
        const gameWithName = await gamesDescriptions.findOne({
          Name: { $regex: new RegExp("^" + parsedBody[0].name + "$", "i") },
        });
        if (gameWithName && gameWithName.Tags) {
          const gameWithNameGenres = gameWithName.Tags.split(",");
          const gameWithNameAggregation = gameWithNameQuery(gameWithNameGenres);

          aggregationPipeline = gameWithNameAggregation;
        } else return "No games found";
      } else {
        const noNameQueryArr = noNameQuery(parsedBody[0]);
        aggregationPipeline = noNameQueryArr;
      }

      const games = await gamesDescriptions.aggregate(aggregationPipeline);

      if (games) {
        return games;
      } else return "No games found";
    }
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const parsedMessages = MessageArraySchema.parse(messages);

  const filteredMessages = parsedMessages.filter((message) => {
    if (message.text === "..." && !message.isUserMessage) {
      return false;
    }

    return true;
  });

  const outboundMessages: ChatGPTMessage[] = filteredMessages.map((message) => {
    return {
      role: message.isUserMessage ? "user" : "system",
      content: message.text,
    };
  });

  const initialMessageList = [...outboundMessages];

  initialMessageList.reverse();

  const initialRes = await getQuery([initialMessageList[0]]);

  if (!initialRes) {
    throw new Error("Something went wrong, please try again later");
  }

  for (let i = outboundMessages.length - 1; i >= 0; i--) {
    if (outboundMessages[i].role === "system") {
      outboundMessages.splice(i, 1);
    }
  }

  const chatbotPrompt = afterQueryPrompt(initialRes);
  outboundMessages.unshift({
    role: "system",
    content: chatbotPrompt,
  });

  const payload: OpenAIStreamPayload = {
    model: "gpt-3.5-turbo",
    messages: outboundMessages,
    temperature: 0.4,
    top_p: 1,
    frequency_penalty: 0,
    presence_penalty: 0,
    stream: true,
    n: 1,
  };

  const stream = await OpenAIStream(payload);

  return new Response(stream);
}
