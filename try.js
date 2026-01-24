const page = "3";
const limit = "10";
const pageNum = console.log(Math.max(1, parseInt(page, 10) || 1));

const limitNum = console.log(
  Math.min(50, Math.max(1, parseInt(limit, 10) || 10))
);
const skip = (pageNum - 1) * limitNum;

// console.log(skip);
