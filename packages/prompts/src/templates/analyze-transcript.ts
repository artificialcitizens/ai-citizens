import { ChatPromptTemplate } from "@langchain/core/prompts";

/** Takes a given transcript and provides a summary, key insights and well as areas of possible contention
 *  @params transcript
 */
export const analyzeTranscriptTemplate = ChatPromptTemplate.fromTemplate(
  `You will be given a transcript. Your task is to summarize the content, offer key insights, and identify any points of contention or unclear information. Follow these steps:
  
  1. Read the following video transcript carefully:
  <transcript>
  {transcript}
  </transcript>
  2. Summarize the main points of the video content in a concise manner. Focus on the key topics discussed and the overall message of the video.
  3. Identify and explain the key insights presented in the video. These should be the most important or novel ideas that viewers can take away from the content.
  4. Analyze the transcript for any points of contention or areas where the information presented is unclear or potentially controversial. This could include conflicting statements, ambiguous explanations, or topics that may require further clarification.
  5. Present your analysis in the following format:
  <summary>
  Provide a concise summary of the video content here, capturing the main points and overall message.
  </summary>
  <key_insights>
  List and briefly explain the key insights from the video. Use bullet points for clarity.
  • Key insight 1
  • Key insight 2
  • Key insight 3 (add more if necessary)
  </key_insights>
  <points_of_contention>
  Identify and explain any points of contention, unclear information, or potentially controversial topics discussed in the video. Use bullet points for clarity.
  • Contention/unclear point 1
  • Contention/unclear point 2
  • Contention/unclear point 3 (add more if necessary)
  </points_of_contention>
  Leave empty if no points of contention or the content is clear
  </points_of_contention>
  Remember to base your analysis solely on the information provided in the transcript. Do not include any external information or personal opinions. If there are no clear points of contention or unclear information, state that in the appropriate section.`
);
