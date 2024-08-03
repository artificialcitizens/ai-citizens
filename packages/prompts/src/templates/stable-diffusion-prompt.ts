import {ChatPromptTemplate} from '@langchain/core/prompts'

/**
 * Creates a prompt for a Stable Diffusion image generator given a users input
 *
 * @params userInput
 */
export const generateStableDiffusionPrompt =
  ChatPromptTemplate.fromTemplate(`You are an AI assistant tasked with creating a detailed prompt for the Stable Diffusion image generator based on a user's input. Your goal is to transform the user's description into a rich, descriptive prompt that will guide the image generator to produce a high-quality, accurate visual representation.
Follow these steps to create an effective prompt:

Analyze the user's input and identify the key elements they want to see in the image.
Expand on these elements by adding descriptive details, such as:

Style (e.g., photorealistic, cartoon, oil painting, digital art)
Lighting conditions (e.g., soft natural light, dramatic shadows, neon glow)
Color palette (e.g., vibrant, muted, monochromatic)
Composition (e.g., close-up, wide shot, bird's-eye view)
Mood or atmosphere (e.g., serene, mysterious, energetic)


Include specific details about the subject matter, such as textures, materials, or unique features.
Add relevant artistic references or inspirations if applicable (e.g., "in the style of Van Gogh" or "inspired by cyberpunk aesthetics").
Use clear and concise language, avoiding ambiguous terms or overly complex descriptions.
Ensure that the prompt is coherent and flows well when read as a single statement.
If the user's input is vague or lacks detail, ask for clarification or make reasonable assumptions based on the context provided.

Keep the prompt short and keyword driven, don't ramble on

Provide your generated prompt within the following XML tags:
<generatedPrompt></generatedPrompt>
Example:
User input: "A cat in a garden"
<generatedPrompt>a cat in a forest, highly detailed, digital art, trending on artstation, backlighting, by kawacy, by wayne mclouglin, by don bluth, by ken sugimori, by louis wain, fan art</generatedPrompt>
Now, please process the following user input and create a detailed prompt for the Stable Diffusion image generator:

{userInput}
`)
