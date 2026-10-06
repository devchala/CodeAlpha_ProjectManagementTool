/**
 * Request schemas (zod). Each schema:
 *  - checks the TYPE first (so `{ "email": { "$ne": null } }` is rejected, not run as a query),
 *  - trims text and enforces length limits,
 *  - drops any field that is not listed (no mass assignment).
 */
const { z } = require("zod");

const OBJECT_ID = /^[a-f\d]{24}$/i;
const PASSWORD_RULES = "Password needs 8+ characters with uppercase, lowercase, a number and a symbol.";

/** Trimmed string with a required message and max length. Pass min: 1 to forbid empty. */
const text = (label, { min = 0, max }) => {
  let s = z
    .string({ required_error: `${label} is required.`, invalid_type_error: `${label} must be text.` })
    .trim();
  if (min) s = s.min(min, `${label} is required.`);
  return s.max(max, `${label} must be at most ${max} characters.`);
};

const objectId = (label, message) =>
  z.string({ required_error: message || `${label} is required.`, invalid_type_error: message || `${label} is invalid.` })
    .regex(OBJECT_ID, message || `${label} is invalid.`);

/** An id, or ""/null meaning "none". Always normalised to id | null. */
const nullableId = (label) =>
  z.union([z.literal(""), z.null(), objectId(label)], { invalid_type_error: `${label} is invalid.` }).transform((v) => v || null);

const email = z
  .string({ required_error: "Enter a valid email address.", invalid_type_error: "Enter a valid email address." })
  .trim()
  .toLowerCase()
  .max(254, "Email is too long.")
  .email("Enter a valid email address.");

/** Accepts "YYYY-MM-DD" or an ISO date-time. ""/null clear the date. Output: Date | null. */
const dueDate = z
  .union([z.string(), z.null()], { invalid_type_error: "Due date is invalid." })
  .transform((value, ctx) => {
    const fail = () => {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "Due date must be a valid date (YYYY-MM-DD)." });
      return z.NEVER;
    };
    if (value === null || value.trim() === "") return null;
    const v = value.trim();
    if (!/^\d{4}-\d{2}-\d{2}(T\d{2}:\d{2}(:\d{2}(\.\d{1,3})?)?(Z|[+-]\d{2}:\d{2})?)?$/.test(v)) return fail();
    const d = new Date(v);
    if (Number.isNaN(d.getTime())) return fail();
    // JavaScript silently turns 2026-02-31 into 2026-03-03, so compare the calendar day back.
    if (new Date(v.slice(0, 10) + "T00:00:00Z").toISOString().slice(0, 10) !== v.slice(0, 10)) return fail();
    const year = d.getUTCFullYear();
    if (year < 2000 || year > 2100) return fail();
    return d;
  });

const priority = z.preprocess(
  (v) => (v === "" ? undefined : v),
  z.enum(["low", "medium", "high"], { errorMap: () => ({ message: "Priority must be low, medium or high." }) }).optional()
);

const status = z.enum(["todo", "in-progress", "done"], {
  errorMap: () => ({ message: "Status must be todo, in-progress or done." }),
});

const REQUIRED_REGISTER = "Name, email and password are required.";

const register = z.object({
  name: z
    .string({ required_error: REQUIRED_REGISTER, invalid_type_error: "Name must be text." })
    .trim()
    .min(1, REQUIRED_REGISTER)
    .max(60, "Name must be at most 60 characters."),
  email,
  password: z
    .string({ required_error: REQUIRED_REGISTER, invalid_type_error: "Password must be text." })
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/, PASSWORD_RULES)
    .refine((v) => Buffer.byteLength(v) <= 72, "Password must be at most 72 bytes."),
});

const login = z.object({
  // Deliberately loose: wrong credentials should look the same whatever the input.
  email: z.string({ required_error: "Email and password are required.", invalid_type_error: "Email and password are required." }).trim().toLowerCase().max(254),
  password: z.string({ required_error: "Email and password are required.", invalid_type_error: "Email and password are required." }).min(1, "Email and password are required.").max(200),
});

const verifyEmail = z.object({
  token: z.string({ required_error: "This verification link is invalid.", invalid_type_error: "This verification link is invalid." })
    .regex(/^[a-f\d]{64}$/i, "This verification link is invalid."),
});

const updateProfile = z
  .object({
    name: text("Name", { min: 1, max: 60 }).optional(),
    avatar: z.string({ invalid_type_error: "Use a PNG, JPG or WebP image under about 100 KB." }).max(140000, "Use a PNG, JPG or WebP image under about 100 KB.").nullable().optional(),
  })
  .refine((d) => d.name !== undefined || d.avatar !== undefined, { message: "Nothing to update." });

const createProject = z.object({
  name: text("Project name", { min: 1, max: 100 }),
  description: text("Description", { max: 1000 }).optional(),
});

const inviteMember = z.object({ email });

const createTask = z.object({
  title: text("Task title", { min: 1, max: 120 }),
  project: objectId("Project", "Choose one of your projects."),
  priority,
  dueDate: dueDate.optional(),
  assignedTo: nullableId("Assignee").optional(),
});

const subtask = z.object({
  title: z.string({ invalid_type_error: "Subtask title must be text." }).trim().max(120, "Subtask title must be at most 120 characters."),
  done: z.boolean({ invalid_type_error: "Subtask done must be true or false." }).optional().default(false),
});

const updateTask = z.object({
  title: text("Task title", { min: 1, max: 120 }).optional(),
  status: status.optional(),
  priority,
  dueDate: dueDate.optional(),
  assignedTo: nullableId("Assignee").optional(),
  description: z.string({ invalid_type_error: "Description must be text." }).max(5000, "Description must be at most 5000 characters.").optional(),
  subtasks: z
    .array(subtask, { invalid_type_error: "Subtasks must be a list." })
    .max(50, "A task can have at most 50 subtasks.")
    .transform((list) => list.filter((s) => s.title)) // blank subtasks are dropped, as before
    .optional(),
});

const addComment = z.object({
  text: z
    .string({ required_error: "Write a comment first.", invalid_type_error: "Comment must be text." })
    .trim()
    .min(1, "Write a comment first.")
    .max(1000, "Comment must be at most 1000 characters."),
});

module.exports = { register, login, verifyEmail, updateProfile, createProject, inviteMember, createTask, updateTask, addComment };
