# Rust-Specific Code Review Searches

These searches complement the universal searches in `code-review/systematic-searches-base.md`.

---

## Category: Unwrap and Expect

```bash
rg "\.unwrap\(\)|\.expect\(" --type rust
```

High. Each usage should be justified. Prefer pattern matching or ? operator for error handling. Unwrap/expect can panic in production.

---

## Category: Unsafe Blocks

```bash
rg "unsafe " --type rust
```

Critical. Every unsafe block requires documentation explaining why it's safe. Unsafe code should be minimal and well-justified.

---

## Category: Clone Overuse

```bash
rg "\.clone\(\)" --type rust
```

Medium. Review each clone(). Excessive cloning impacts performance. Consider borrowing or Rc/Arc when appropriate.

---

## Category: Panic in Production Code

```bash
rg "panic!|unimplemented!|unreachable!|todo!" --type rust
```

High. Production code should not panic. Use Result types for errors. todo!/unimplemented! are for development only.

---

## Category: Mutex and RwLock Poisoning

```bash
rg "\.lock\(\)\.unwrap\(\)|\.write\(\)\.unwrap\(\)|\.read\(\)\.unwrap\(\)" --type rust
```

Medium. Lock poisoning from panics inside locks. Consider using try_lock or handling poisoned locks explicitly.

---

## Category: Blocking Operations in Async

```bash
rg "std::thread::sleep|std::fs::|std::io::" --type rust
```

High in async code. Verify no blocking operations in async functions. Use tokio::fs, tokio::time::sleep, etc. in async contexts.

---

## Category: Missing Error Context

```bash
rg "\.map_err\(|\.context\(|\.with_context\(" --type rust
```

Medium. Check if errors provide sufficient context. Use anyhow or thiserror for better error messages.

---

## Category: Vec Capacity

```bash
rg "Vec::new\(\)|vec!\[\]" --type rust
```

Low-Medium. If vector size is known, use Vec::with_capacity() to avoid reallocations.

---

## Category: String Concatenation

```bash
rg "\+ \"|\+ &str" --type rust
```

Low-Medium. String concatenation with + creates intermediate allocations. Use format! or String::push_str for multiple concatenations.

---

## Category: Lifetime Issues

Manual review required. Look for:
- Overly complex lifetime annotations
- Unnecessary lifetime parameters
- Lifetime elision opportunities

---

## Category: Missing Documentation

```bash
rg "^pub (fn|struct|enum|trait|mod)" --type rust
```

Medium. Public items should have doc comments (///). Check if public API is documented.

---

## Category: Deprecated Items

```bash
rg "#\[deprecated\]" --type rust
```

Medium. Check if deprecated items are still in use. Plan migration path.

---

## Category: Test Coverage

```bash
rg "#\[test\]|#\[cfg\(test\)\]" --type rust
```

Info. Verify critical functionality has test coverage. Use cargo tarpaulin for coverage reports.
