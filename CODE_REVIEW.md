# Code Review: jessica_core.py

## Executive Summary
The code is functional but has several areas for improvement in error handling, code quality, security, and maintainability.

---

## 🔴 Critical Issues

### 1. **Missing Input Validation in `/chat` Endpoint** (Line 380-381)
**Issue**: No validation that `request.json` exists or contains required fields.
**Risk**: Will crash with `KeyError` or `TypeError` if malformed request sent.
```python
# Current (vulnerable):
data = request.json
user_message = data['message']  # Will crash if data is None or missing 'message'

# Should be:
if not request.json or 'message' not in request.json:
    return jsonify({"error": "Missing 'message' field"}), 400
```

### 2. **Bare `except:` Clauses** (Lines 456, 462)
**Issue**: Catching all exceptions without logging or handling properly.
**Risk**: Hides errors, makes debugging difficult.
```python
# Current:
except:
    pass

# Should be:
except Exception as e:
    # Log the error for debugging
    print(f"Status check failed: {e}")
```

### 3. **Missing Error Handling in `/transcribe` Endpoint** (Line 468-473)
**Issue**: No validation that 'audio' file exists in request.
**Risk**: Will crash if no file uploaded.
```python
# Should add:
if 'audio' not in request.files:
    return jsonify({"error": "No audio file provided"}), 400
```

---

## 🟡 Medium Priority Issues

### 4. **Unused Import: `json`** (Line 3)
**Issue**: `json` module is imported but never used.
**Action**: Remove the import.

### 5. **Inconsistent Error Return Types**
**Issue**: Some functions return error strings, others return dicts with errors.
- `call_claude_api()` returns string: `"Error: ANTHROPIC_API_KEY not configured"`
- `mem0_add_memory()` returns dict: `{"error": "MEM0_API_KEY not configured"}`

**Recommendation**: Standardize on dict format for better error handling.

### 6. **Using `print()` Instead of Logging** (Multiple locations)
**Issue**: Using `print()` for error messages instead of proper logging.
**Locations**: Lines 260, 282, 309, 318, 345, 351, 370

**Recommendation**: Use Python's `logging` module:
```python
import logging
logger = logging.getLogger(__name__)
logger.error(f"Mem0 search error: {e}")
```

### 7. **Missing Type Hints**
**Issue**: Some functions missing return type hints or parameter types.
- `_store_memory_dual_sync()` - no return type
- `store_memory_dual()` - no return type
- `recall_memory_dual()` - has return type but could be more specific

### 8. **Inconsistent Prompt Building**
**Issue**: Different APIs receive prompts differently:
- `call_local_ollama()`: receives `full_prompt`
- `call_claude_api()`: receives `user_message` + `master_prompt + context_text` separately
- `call_grok_api()`: receives `user_message` + `master_prompt + context_text` separately  
- `call_gemini_api()`: receives `full_prompt`

**Recommendation**: Standardize the interface for consistency.

### 9. **Magic Numbers and Strings**
**Issue**: Hard-coded values scattered throughout:
- `2048` (max_tokens) - appears multiple times
- `200` (character truncation) - line 396, 399
- `"dolphin-llama3:8b"` - default model
- Timeout values: `120`, `60`, `30`, `5`, `2`

**Recommendation**: Extract to constants at top of file:
```python
DEFAULT_MAX_TOKENS = 2048
MEMORY_TRUNCATE_LENGTH = 200
DEFAULT_OLLAMA_MODEL = "dolphin-llama3:8b"
API_TIMEOUT = 60
LOCAL_SERVICE_TIMEOUT = 5
```

### 10. **Potential Security Issue: API Key Exposure in Error Messages**
**Issue**: Error messages might leak API response data that could contain sensitive info.
**Line 137, 175, 195**: Returning full response data in error messages.

**Recommendation**: Sanitize error responses:
```python
# Instead of:
return f"Error: Unexpected Claude response: {data}"

# Use:
return f"Error: Unexpected Claude response format"
```

---

## 🟢 Low Priority / Code Quality

### 11. **Code Duplication in API Functions**
**Issue**: `call_claude_api()`, `call_grok_api()`, and `call_gemini_api()` have similar patterns.
**Recommendation**: Consider creating a base function or using a configuration-driven approach.

### 12. **Missing Docstrings for Some Functions**
**Issue**: Some helper functions lack docstrings.
- `_store_memory_dual_sync()` - has docstring ✓
- `store_memory_dual()` - has docstring ✓
- All API functions have docstrings ✓

### 13. **Keyword Sets Should Be Sets, Not Dicts**
**Issue**: `RESEARCH_KEYWORDS`, `COMPLEX_REASONING_KEYWORDS`, `DOCUMENT_KEYWORDS` are defined as dicts but used as sets.
**Current**: `RESEARCH_KEYWORDS = {...}` (creates a dict)
**Should be**: `RESEARCH_KEYWORDS = {...}` (but they're actually sets, so this is fine)

Actually, these ARE sets (using `{}` with no colons), so this is correct. ✓

### 14. **Missing Environment Variable Validation**
**Issue**: No startup validation that required environment variables are set.
**Recommendation**: Add validation in `if __name__ == '__main__':` block.

### 15. **Inconsistent Exception Handling**
**Issue**: Some functions catch `Exception`, others catch specific exceptions, some use bare `except:`.
**Recommendation**: Standardize on catching specific exceptions where possible.

### 16. **No Request Timeout Configuration**
**Issue**: Timeouts are hard-coded. No way to configure them.
**Recommendation**: Make timeouts configurable via environment variables.

### 17. **Memory ID Collision Risk**
**Issue**: Using only first 16 characters of SHA256 hash for memory ID (line 294).
**Risk**: Low but possible collision with many memories.
**Recommendation**: Use full hash or add timestamp to ensure uniqueness.

### 18. **Missing Type Checking for Memory Context**
**Issue**: Line 395, 398 check `isinstance(mem, str)` but don't handle other types gracefully.
**Recommendation**: Add else clause or better type handling.

---

## 📋 Recommendations Summary

### High Priority (Do First):
1. ✅ Add input validation to `/chat` endpoint
2. ✅ Fix bare `except:` clauses
3. ✅ Add error handling to `/transcribe` endpoint
4. ✅ Remove unused `json` import

### Medium Priority:
5. Standardize error return types
6. Replace `print()` with proper logging
7. Extract magic numbers to constants
8. Add type hints where missing

### Low Priority (Nice to Have):
9. Refactor API call functions to reduce duplication
10. Add environment variable validation on startup
11. Make timeouts configurable
12. Sanitize error messages to prevent data leakage

---

## ✅ What's Good

1. **Good use of connection pooling** with `requests.Session()`
2. **Proper use of `@lru_cache`** for master prompt loading
3. **Non-blocking memory storage** using threads
4. **Clear code organization** with section headers
5. **Good docstrings** on most functions
6. **Type hints** on most function signatures
7. **Efficient keyword lookup** using sets
8. **Graceful degradation** when services are unavailable

---

## 🔧 Quick Wins (Easy Fixes)

1. Remove unused `json` import (1 line)
2. Add input validation to `/chat` (3-4 lines)
3. Replace bare `except:` with proper exception handling (2 lines each)
4. Extract magic numbers to constants (10-15 lines)

Estimated time: 30-45 minutes for all quick wins.

