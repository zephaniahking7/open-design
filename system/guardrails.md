REPO VALIDATION RULE:

If any tool reports a repo or directory as missing:
1. Verify using direct path inspection (ls, known path checks)
2. Do not rely solely on glob/search results
3. Assume large directories may exceed traversal limits
4. Only conclude missing after manual confirmation

Reason:
Prevents false negatives from tool limitations and avoids incorrect system decisions.