# Rust Build & Test Commands

Commands to run during code review for Rust projects.

---

## Build & Test

```bash
cargo build --release
cargo test
```

All must pass. Document any failures as Critical findings.

---

## Linting with Clippy

```bash
cargo clippy -- -D warnings
```

Clippy should pass with no warnings. Document any failures as High findings.

---

## Format Check

```bash
cargo fmt -- --check
```

Code must be formatted according to rustfmt. Document any failures as Medium findings.

---

## Security Audit

```bash
cargo audit
```

Review any vulnerabilities in dependencies. Document High and Critical vulnerabilities as Critical findings.

---

## Additional Checks

```bash
# Check for unused dependencies
cargo udeps

# Check documentation
cargo doc --no-deps --open

# Check for outdated dependencies
cargo outdated
```

Review results and document significant issues.
