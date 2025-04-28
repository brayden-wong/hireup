import { z } from "zod";

import { Request } from "../utils";
import { EXPERIENCE } from "@hireup/common/constants";

const MAX_FILE_SIZE = 1 * 1024 * 1024;
export const ACCEPTED_DOCUMENT_TYPES = [
  "application/pdf",
  "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
].join(",");

type ProfileBody = {};

export async function POST(req: Request<ProfileBody>) {}
