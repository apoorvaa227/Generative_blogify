import axios from "axios";
import { StatusCodes } from "http-status-codes";
import { BadRequestError } from "../errors";
import { Request, Response } from "express";

// Generate Text Suggestion using Hugging Face API
const getTextSuggestion = async (req: Request, res: Response) => {
  try {
    const text = req.query.text as string;

    if (!text) {
      throw new BadRequestError("Please provide a 'text' for suggestion.");
    }

    const response = await fetch(
      "https://api-inference.huggingface.co/models/meta-llama/",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        },
        body: JSON.stringify({
          inputs: text,
          parameters: { max_new_tokens: 25 },
        }),
      }
    );

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    const data = await response.json();
    const generated_text = data[0]?.generated_text || "No text generated.";

    res.status(StatusCodes.OK).json({
      data: generated_text,
      success: true,
      msg: "Text suggestion fetched successfully.",
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Failed to fetch text suggestion.",
      error: (error as Error).message,
    });
  }
};

// Generate Image Suggestion Prompt using Hugging Face API
const getImageSuggestionPrompt = async (req: Request, res: Response) => {
  try {
    const prompt = req.query.prompt as string;

    if (!prompt) {
      throw new BadRequestError(
        "Please provide a 'prompt' for image suggestion."
      );
    }

    const response = await axios({
      url: "https://api-inference.huggingface.co/models/stabilityai/stable-diffusion",
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type": "application/json",
      },
      data: JSON.stringify({ inputs: prompt }),
      responseType: "stream",
    });

    if (response.status !== 200) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    // Set response headers
    res.set(response.headers);
    res.set("x-ai-generated-image", "true");
    res.header("Access-Control-Expose-Headers", "x-ai-generated-image");

    // Stream the response to the client
    response.data.pipe(res);
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "Failed to fetch image suggestion.",
      error: (error as Error).message,
    });
  }
};

export { getTextSuggestion, getImageSuggestionPrompt };
