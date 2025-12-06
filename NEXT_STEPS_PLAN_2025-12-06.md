# Jessica Core - Next Steps Plan
**Date:** December 6, 2025  
**Status:** Ready to Execute  
**Token Budget:** 50% remaining (resets Jan 2, 2026)

---

## 🎯 CURRENT SITUATION

- **5 Critical Security Issues** identified (5.5 hours estimated)
- **Google Calendar Integration** TODO (not started)
- **Single-user safe**, NOT multi-user ready
- **Token usage:** 50% of monthly limit (resets Jan 2)

---

## 📋 RECOMMENDED EXECUTION PLAN

### Phase 1: Quick Wins (Use Cheaper Models)
**Estimated Time:** 2 hours  
**Token Strategy:** Use o1-mini or claude-haiku

#### Fix 1: CORS Restrictions (30 min)
- **Model:** o1-mini or claude-haiku
- **Why:** Simple config change, minimal reasoning needed
- **File:** `jessica_core.py:25`
- **Effort:** LOW

#### Fix 5: Input Validation (30 min)
- **Model:** o1-mini or claude-haiku
- **Why:** Straightforward validation functions
- **File:** `jessica_core.py` (new validation functions)
- **Effort:** LOW

#### Fix 2: User Isolation (90 min)
- **Model:** claude-haiku (or o1-mini for review)
- **Why:** Code changes, not heavy reasoning
- **Files:** `jessica_core.py` (multiple locations)
- **Effort:** MEDIUM

---

### Phase 2: Medium Complexity (Use Mid-Tier Models)
**Estimated Time:** 3 hours  
**Token Strategy:** Use claude-haiku, escalate to sonnet only if stuck

#### Fix 3: Move API Keys to Backend (60 min)
- **Model:** claude-haiku or claude-sonnet (if stuck)
- **Why:** Proxy endpoints + frontend refactor
- **Files:** `jessica_core.py`, `frontend/lib/api/aiFactory.ts`
- **Effort:** MEDIUM

#### Fix 4: Real Authentication (120 min)
- **Model:** claude-sonnet (only if needed)
- **Why:** Firebase integration can be tricky
- **Files:** `jessica_core.py`, `frontend/lib/middleware/auth.ts`
- **Effort:** HIGH

---

## 🤖 MODEL RECOMMENDATIONS BY TASK

| Task Type | Recommended Model | Why |
|-----------|------------------|-----|
| Code review/planning | **o1-mini** or **claude-haiku** | Cheaper, good for logic |
| Straightforward implementation | **o1-mini** or **claude-haiku** | Simple code changes |
| Complex architecture decisions | **claude-sonnet** (sparingly) | Only when truly needed |
| Debugging | **o1-mini** or **claude-haiku** | Cost-effective |

---

## 💡 TOKEN-SAVING STRATEGY

1. **Batch similar fixes** in one session
2. **Use o1-mini** for code review (cheaper, good for logic)
3. **Use claude-haiku** for implementation guidance
4. **Reserve claude-sonnet** for complex problems only
5. **Do manual work yourself** when possible (copy-paste from docs)

---

## 📅 SUGGESTED EXECUTION ORDER

### Session 1: Quick Wins (Today)
- ✅ Fix 1: CORS restrictions (30 min) - **o1-mini**
- ✅ Fix 5: Input validation (30 min) - **o1-mini**
- ✅ Start Fix 2: User isolation (30 min) - **claude-haiku**

**Total:** ~1.5 hours, minimal token usage

### Session 2: Continue Security (Tomorrow)
- ✅ Finish Fix 2: User isolation (60 min) - **claude-haiku**
- ✅ Fix 3: Move API keys to backend (60 min) - **claude-haiku**

**Total:** ~2 hours, moderate token usage

### Session 3: Final Security Fix (Next Session)
- ✅ Fix 4: Real authentication (120 min) - **claude-sonnet** (only if needed)

**Total:** ~2 hours, higher token usage (only if complex)

---

## 🔄 ALTERNATIVE: DEFER SECURITY FIXES

If you want to focus on **features** instead:

- ✅ Implement Google Calendar integration
- ✅ Add missing features from audit
- ✅ Improve existing functionality

**Note:** Security fixes are **required before multi-user launch**, but can wait if staying single-user.

---

## ✅ RECOMMENDATION

**Start with Fixes 1 & 5** (~1 hour total, use **o1-mini**):
- Quick wins
- Low risk
- Immediate security improvement
- Minimal token usage

Then decide: continue security fixes or switch to features.

---

## 📊 PROGRESS TRACKING

### Phase 1: Quick Wins
- [ ] Fix 1: CORS restrictions
- [ ] Fix 5: Input validation
- [ ] Fix 2: User isolation (start)

### Phase 2: Medium Complexity
- [ ] Fix 2: User isolation (finish)
- [ ] Fix 3: Move API keys to backend
- [ ] Fix 4: Real authentication

### Phase 3: Future Work
- [ ] Google Calendar integration
- [ ] Rate limiting
- [ ] Error monitoring improvements

---

## 📚 REFERENCE DOCS

- **Security Audit:** `AUDIT_SUMMARY.txt`
- **Security Fix Plan:** `SECURITY_FIX_PLAN.md`
- **Quick Reference:** `SECURITY_QUICK_REF.md`
- **Full Audit:** `CODE_AUDIT_2025-12-06.md`

---

## 🎯 SUCCESS CRITERIA

**Phase 1 Complete When:**
- ✅ CORS only allows configured origins
- ✅ All inputs validated and sanitized
- ✅ User isolation implemented
- ✅ Security tests pass

**Phase 2 Complete When:**
- ✅ All API keys moved to backend
- ✅ Real authentication working
- ✅ Integration tests pass
- ✅ Ready for multi-user launch

---

**For the forgotten 99%, we rise. 🔥**

*Last Updated: December 6, 2025*  
*Next Review: After Session 1 completion*

