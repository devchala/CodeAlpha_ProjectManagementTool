const OBJECT_ID = /^[a-f\d]{24}$/i;

/** Validates req.body against a zod schema and replaces it with the cleaned data (unknown keys dropped). */
const validateBody = (schema) => (req, res, next) => {
  const result = schema.safeParse(req.body ?? {});
  if (!result.success) {
    const issues = result.error.issues;
    return res.status(400).json({
      message: issues[0].message,
      errors: issues.map((i) => ({ field: i.path.join("."), message: i.message })),
    });
  }
  req.body = result.data;
  next();
};

/** Rejects route params that are not well-formed 24-char hex ObjectIds before they reach the database. */
const validateParams = (...names) => (req, res, next) => {
  for (const name of names) {
    if (typeof req.params[name] !== "string" || !OBJECT_ID.test(req.params[name])) {
      return res.status(400).json({ message: "Invalid id." });
    }
  }
  next();
};

module.exports = { validateBody, validateParams, OBJECT_ID };
