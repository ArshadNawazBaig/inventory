# Prompt: Refactor

> **Status:** 🟡 Seed · **Owner:** Eng · **Use:** improving code without changing behavior.

Refactor the target code to StockFlow standards ([CLAUDE.md](../CLAUDE.md)) **without changing
observable behavior**. Safety first.

## Rules
- Preserve behavior; rely on existing tests and **add tests first** if coverage is missing.
- Small, reversible steps; explain each. No drive-by feature changes.
- Apply SOLID/DRY/KISS; move logic to the correct layer; remove duplication into shared utils.
- Improve names per [context/terminology](../context/terminology.md); strengthen types (kill `any`).
- Respect module boundaries and dependency rules.

## Output (mandatory format)
1. **Analysis** — current smells, risks, blast radius.
2. **Architecture Decisions** — target structure and why.
3. **Advantages** — what improves (readability, testability, performance).
4. **Possible Improvements** — further steps deferred for safety.
5. **Implementation** — the refactor, step by step, with tests proving behavior is unchanged.
6. **Testing Notes** — how behavior parity is verified.
7. **Future Scalability** — what this unlocks.

## Don't
- Don't mix refactor + feature in one change. Don't weaken types or disable lint to "make it pass".
