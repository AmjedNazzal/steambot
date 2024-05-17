export function gameWithNameQuery(gameWithNameGenres: any) {
  const query = {
    $text: { $search: gameWithNameGenres.join(" ") }, // Join genres for text search
  };

  const aggregationPipeline = [
    { $match: query },
    {
      $addFields: {
        matchCount: {
          $sum: gameWithNameGenres.map((genre: any) => ({
            $size: {
              $regexFindAll: {
                input: "$Tags",
                regex: new RegExp(`\\b${genre}\\b`, "gi"),
              },
            },
          })),
        },
      },
    },
    { $sort: { matchCount: -1 } },
    { $limit: 30 },
    { $project: { Tags: 0, _id: 0, matchCount: 0 } },
  ];

  return aggregationPipeline;
}

interface ParsedNoNameBodyInterface {
  genres: string[];
  keywords: string[];
}
export function noNameQuery(parsedBody: ParsedNoNameBodyInterface) {
  const searchTerms = [...parsedBody.keywords, ...parsedBody.genres].join(" ");

  const query = {
    $text: { $search: searchTerms },
  };
  let aggregationPipeline: any[] = [];

  if (
    parsedBody.keywords &&
    parsedBody.keywords.length > 0 &&
    parsedBody.genres &&
    parsedBody.genres.length > 0
  ) {
    aggregationPipeline = [
      { $match: query },
      {
        $addFields: {
          matchCount: {
            $sum: [
              ...parsedBody.keywords.map((keyword: any) => ({
                $size: {
                  $regexFindAll: {
                    input: "$Description",
                    regex: new RegExp(`\\b${keyword}\\b`, "gi"),
                  },
                },
              })),
              ...parsedBody.genres.map((genre: any) => ({
                $size: {
                  $regexFindAll: {
                    input: "$Tags",
                    regex: new RegExp(`\\b${genre}\\b`, "gi"),
                  },
                },
              })),
            ],
          },
        },
      },
      {
        $sort: { matchCount: -1 },
      },
      // Limit the results to the first 10 matches
      { $limit: 30 },
      { $project: { Tags: 0, _id: 0, matchCount: 0 } },
    ];
  } else {
    // If no keywords are provided, just perform a simple match and limit
    aggregationPipeline = [
      { $match: query },
      { $limit: 30 },
      { $project: { Tags: 0, _id: 0, matchCount: 0 } },
    ];
  }

  return aggregationPipeline;
}
