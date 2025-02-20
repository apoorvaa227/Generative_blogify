import User from "../models/user";
import Blogs from "../models/blog";
import { Request, Response } from "express";
import { BadRequestError } from "../errors";
import { StatusCodes } from "http-status-codes";
import natural from "natural";
import WordNet from "node-wordnet";

const wordnet = new WordNet();
const blogTokenizer = new natural.WordTokenizer();

// Function to get synonyms of a word using WordNet
const getSynonyms = (word: string): Promise<string[]> => {
  return new Promise((resolve, reject) => {
    wordnet.lookup(word, (err: Error | null, definitions: any[]) => {
      if (err) {
        reject(err);
      } else {
        const synonyms = definitions.reduce((acc: string[], definition) => {
          if (definition.synonyms) {
            return acc.concat(definition.synonyms);
          }
          return acc;
        }, []);
        resolve(synonyms);
      }
    });
  });
};

// Search Function for Users and Blogs
const search = async (req: Request, res: Response) => {
  try {
    const { type, query } = req.query;

    if (!query) {
      throw new BadRequestError("Query is required");
    }

    switch (type) {
      case "user": {
        const userTotalCount = await User.countDocuments({
          name: { $regex: query as string, $options: "i" },
        });

        const users = await User.find({
          name: { $regex: query as string, $options: "i" },
        })
          .select("name email profileImage")
          .skip(req.pagination?.skip || 0)
          .limit(req.pagination?.limit || 10)
          .sort({ createdAt: -1 });

        return res.status(StatusCodes.OK).json({
          data: {
            users,
            totalCount: userTotalCount,
            page: req.pagination?.page || 1,
            limit: req.pagination?.limit || 10,
          },
          success: true,
          msg: "Users Fetched Successfully",
        });
      }

      case "blog": {
        const blogQueryTokens = blogTokenizer.tokenize(query.toString().toLowerCase());
        let synonymTokens: string[] = [];
        let queryObject: any = {};

        if (blogQueryTokens.length > 0) {
          const synonyms: string[][] = await Promise.all(
            blogQueryTokens.map((token) => getSynonyms(token))
          );

          synonymTokens = synonyms.flat();
          queryObject = {
            $or: [
              { title: { $regex: query.toString(), $options: "i" } },
              { title: { $in: synonymTokens } },
              { tags: { $in: synonymTokens } },
            ],
          };
        }

        const blogTotalCount = await Blogs.countDocuments(queryObject);
        const blogs = await Blogs.find(queryObject)
          .select("title description img author tags views likes")
          .populate({ path: "author", select: "name profileImage" })
          .skip(req.pagination?.skip || 0)
          .limit(req.pagination?.limit || 10);

        return res.status(StatusCodes.OK).json({
          data: {
            blogs,
            totalCount: blogTotalCount,
            page: req.pagination?.page || 1,
            limit: req.pagination?.limit || 10,
          },
          success: true,
          msg: "Blogs Fetched Successfully",
        });
      }

      default:
        throw new BadRequestError("Invalid type, accepted types are 'user' and 'blog'.");
    }
  } catch (error) {
    return res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      msg: "An error occurred while searching.",
      error: (error as any).message,
    });
  }
};

export { search };
