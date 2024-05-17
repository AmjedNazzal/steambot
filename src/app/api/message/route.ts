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
    const queryBotMessages = [
      {
        role: "system",
        content: initialPrompt,
      },
      ...messages,
    ];

    const res = await fetch(`${process.env.OPENAI_URL}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-3.5-turbo",
        messages: queryBotMessages,
        temperature: 0.1,
        top_p: 1,
        frequency_penalty: 0,
        presence_penalty: 0,
        n: 1,
      }),
    });

    if (res.ok) {
      const data = await res.json();
      try {
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
            const gameWithNameAggregation =
              gameWithNameQuery(gameWithNameGenres);

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
      } catch (error) {
        return "No games found";
      }
    }
  } catch (error) {
    return null;
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json();

  const parsedMessages = MessageArraySchema.parse(messages);

  const filteredMessages = parsedMessages.filter((message: Message) => {
    if (message.text === "..." && !message.isUserMessage) {
      return false;
    }

    return true;
  });

  const outboundMessages: ChatGPTMessage[] = filteredMessages.map(
    (message: Message) => {
      return {
        role: message.isUserMessage ? "user" : "assistant",
        content: message.text,
      };
    }
  );

  const initialRes = await getQuery(outboundMessages);

  if (!initialRes) {
    throw new Error("Something went wrong, please try again later");
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
