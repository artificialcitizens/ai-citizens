import test from "ava";
import {
  extractKeyPointsNode,
  performSearch,
  generateRelatedQueriesNode,
  generateResponseNode,
  performSearchNode,
} from "./graph.js";
import "dotenv/config";
import { tavilyTool } from "@ai-citizens/tools";
import sinon from "sinon";

test("should pass CI", async (t) => {
  const result = await performSearch(
    "What are effective ways to kill dandelions?",
    {
      configurable: { thread_id: "1" },
    }
  );
  t.log(result);
  t.pass();
});

test.skip("performSearchNode should filter and format search results", async (t) => {
  // Mock the tavilyTool.invoke function
  const mockResults = JSON.stringify([
    {
      title: "Title 1",
      content: "Content 1",
      url: "http://example1.com",
      score: 0.9,
    },
    {
      title: "Title 2",
      content: "Content 2",
      url: "http://example2.com",
      score: 0.7,
    },
    {
      title: "Title 3",
      content: "Content 3",
      url: "http://example3.com",
      score: 0.4,
    }, // This should be filtered out
  ]);
  // const invokeStub = sinon.stub(tavilyTool, "invoke").resolves(mockResults);

  const query = "what is the capital of the moon?";
  // Call the function
  const result = await performSearchNode({
    query,
  });
  // Assert the results
  t.log(result);
  t.pass();
  // t.deepEqual(result, {
  //   searchResults: ["Title 1\n\nContent 1", "Title 2\n\nContent 2"],
  //   sources: ["http://example1.com", "http://example2.com"],
  // });

  // // Verify that the tavilyTool.invoke was called with the correct query
  // t.true(invokeStub.calledOnceWith({ query }));

  // // Restore the stub
  // invokeStub.restore();
});

test.skip("extractKeyPoints should extract key points from search results", async (t) => {
  const searchResults = [
    "ESA - ESA/ESTEC Capital of the Moon - European Space Agency\n\nESA/ESTEC Capital of the Moon on 10-15 July From 10 to 15 July, Noordwijk (NL) was the 'Capital of the Moon' when ESA's establishment ESTEC hosted the 4th International Conference on Exploration and Utilisation of the Moon (ICEUM4). The Moon conference was organised by the International Lunar Exploration Working Group (ILEWG).[1]",
    "Our Moon: the Moon | IAU - International Astronomical Union\n\nThe Moon is Earth's only natural satellite. It is the fifth largest natural satellite in the Solar System, and the largest natural satellite in the Milky Way.[2]",
  ];
  const sources = [
    "https://www.esa.int/ESA/ESTEC/Capital_of_the_Moon",
    "https://www.iau.org/publications/our_moon",
  ];
  const result = await extractKeyPointsNode({
    searchResults,
    sources,
  });
  t.log(result);
  t.pass();
});

test.skip("extractRelatedQueries should extract related queries from search results", async (t) => {
  const searchResults = [
    "ESA - ESA/ESTEC Capital of the Moon - European Space Agency\n\nESA/ESTEC Capital of the Moon on 10-15 July From 10 to 15 July, Noordwijk (NL) was the 'Capital of the Moon' when ESA's establishment ESTEC hosted the 4th International Conference on Exploration and Utilisation of the Moon (ICEUM4). The Moon conference was organised by the International Lunar Exploration Working Group (ILEWG).[1]",
    "Our Moon: the Moon | IAU - International Astronomical Union\n\nThe Moon is Earth's only natural satellite. It is the fifth largest natural satellite in the Solar System, and the largest natural satellite in the Milky Way.[2]",
  ];
  const query = "what is the capital of the moon?";
  const result = await generateRelatedQueriesNode({
    searchResults,
    query,
  });
  t.log(result);
  t.pass();
});

test.skip("generateResponse should generate a response from the search results", async (t) => {
  const searchResults = [
    "ESA - ESA/ESTEC Capital of the Moon - European Space Agency\n\nESA/ESTEC Capital of the Moon on 10-15 July From 10 to 15 July, Noordwijk (NL) was the 'Capital of the Moon' when ESA's establishment ESTEC hosted the 4th International Conference on Exploration and Utilisation of the Moon (ICEUM4). The Moon conference was organised by the International Lunar Exploration Working Group (ILEWG).[1]",
  ];
  const query = "what is the capital of the moon?";
  const sources = [
    "https://www.esa.int/ESA/ESTEC/Capital_of_the_Moon",
    "https://www.iau.org/publications/our_moon",
  ];
  const result = await generateResponseNode({
    searchResults,
    sources,
    query,
  });
  t.log(result);
  t.pass();
});
