# Maintainers Update Plan (Do not include in agent context)

Audience: Human or tooling maintainers iterating on documentation. This is not a usage guide and should not be included in runtime agent prompts.

## Goals
- Keep docs concise for small context windows, but accurate to current contracts.
- Reduce redundancy: Prefer canonical pages and cross-linking.
- Capture non-obvious nuances briefly (e.g., Zapper quoteIn placeholder, sink-driven sizing).

## Cross-file Linking
- `docs/index.md`: links to all key pages plus `defiactions-agent-quick-rules.mdc`.
- Each guidance page ends with cross-links to related pages (agent rules → connectors/composition/checklist/workflows).
- Workflows reference connectors and templates by anchors.

## Style Decisions
- Transaction block order is `prepare` → `pre` → `post` → `execute` (readability/auditability).
- When immediately depositing into a sink, size `withdrawAvailable(maxAmount:)` by `sink.minimumCapacity()`.
- Use string imports exactly; no address literals in docs.
- Prefer helpers over raw addresses (e.g., `borrowPool(pid:)`).
- Restake documentation: single canonical workflow in `workflows/restaking-workflow.md`; templates page references it instead of duplicating.

## Nuances surfaced from code/tests
- IncrementFi Zapper:
  - `quoteIn` is placeholder (supports `UFix64.max` only). Prefer `quoteOut` and capacity-driven sizing.
  - `swapBack` returns token0 (swapper `inType`).
- `SwapConnectors.SwapSink` computes input using `quoteIn(forDesired: sink.minimumCapacity())` internally.

## Open Candidates for Future Iteration
- Core Framework: add a one-liner under Source/Sink explaining sink-driven sizing when chaining.
- Testing page: add a brief example asserting `vault.balance == 0.0` after deposit in more scenarios.
- Consider a compact “Events and IDs” note: `createUniqueIdentifier`, `alignID` usage patterns for tracing (only if needed).

## Editor Checklist for Future PRs
- When changing connector signatures, update: `connectors.md`, examples in `composition.md`, templates, `agent-rules.md`, quick rules `.mdc`, and any workflow pages.
- Search/replace for outdated module names (`SwapStack`, `FungibleTokenStack`) and for `poolID:` labels.
- Verify all `withdrawAvailable(maxAmount:)` calls that immediately deposit into a sink use `sink.minimumCapacity()`.
- Keep `defiactions-agent-quick-rules.mdc` minimal and paste-ready for `.cursor/rules`.

## Not in Agent Context
- This file is meta-documentation for maintainers. Do not feed into runtime AI prompts. 