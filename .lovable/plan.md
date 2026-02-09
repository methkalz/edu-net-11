

# Fix: Correct Game-to-Topic Mappings in Database

## The Problem

The SQL migration inserted **wrong topic IDs** for 3 out of 8 game mappings. This causes:
1. "مقدمة في شبكات الحاسوب" (first topic) shows a **locked** Topology game instead of showing nothing
2. "الطوبولوجيا الفيزيائية والمنطقية" (correct topic) has **no game** linked to it
3. Same issue for LAN/WAN and Cables topics

## Correct Mappings (After Fix)

| # | Topic (Correct) | Topic ID | Game | Level |
|---|----------------|----------|------|-------|
| 1 | مركبات الاتصال الأساسية | `78a29295-...` | مطابقة مركبات الاتصال الأساسية | L1-S1 |
| 2 | الطوبولوجيا الفيزيائية والمنطقية | `bf25e397-...` | مطابقة الطوبولوجيا | L1-S2 |
| 3 | LAN, WAN, WLAN, Internet | `39489500-...` | مطابقة أنواع الشبكات | L1-S3 |
| 4 | البروتوكولات الأساسية | `db2d8e62-...` | مطابقة البروتوكولات | L1-S5 |
| 5 | العنوان المنطقي (IP Address) | `4295cd31-...` | مطابقة عناوين IP | L1-S6 |
| 6 | أنواع الكابلات والموصلات | `f8daff33-...` | مطابقة الكابلات | L1-S7 |
| 7 | أمان WLAN وطرق التشفير | `23877110-...` | مطابقة مفاهيم الأمان | L1-S8 |
| 8 | نموذج OSI | `8328e392-...` | مطابقة طبقات نموذج OSI | L2-S5 |

## What Changed (3 rows to fix)

| Wrong Topic ID | Wrong Topic | Correct Topic ID | Correct Topic |
|---|---|---|---|
| `57b88a37` | مقدمة في شبكات الحاسوب | `bf25e397` | الطوبولوجيا الفيزيائية والمنطقية |
| `944d7533` | Ethernet LANs | `39489500` | LAN, WAN, WLAN, Internet |
| `fa1b588e` | العنوان الفيزيائي MAC | `f8daff33` | أنواع الكابلات والموصلات |

## Technical Implementation

### Step 1: SQL Migration
Update the 3 incorrect rows in `grade11_content_games`:

```sql
UPDATE grade11_content_games 
SET topic_id = 'bf25e397-0d9e-49fc-9006-683487076f94'
WHERE game_id = 'edaaf78e-a93a-4abf-a169-7baf09576b48';

UPDATE grade11_content_games 
SET topic_id = '39489500-d531-4c9d-970e-c3ec69711aed'
WHERE game_id = 'e69492d3-a2a6-499b-81cb-5f7e5a463a55';

UPDATE grade11_content_games 
SET topic_id = 'f8daff33-91ff-4861-b826-94f9c175a682'
WHERE game_id = '157aad63-0e10-43c3-b1f3-8d4e7fa690c3';
```

### Step 2: Verify Hook Logic
The `useLessonGame` hook's prerequisite logic is correct:
- L1-S1 (first game) has no prerequisites, so it's always unlocked
- Each subsequent game requires all previous level/stage games to be completed
- No code changes needed -- only the data was wrong

## Expected Result After Fix

In section "أساسيات الاتصال":
- Topic "مركبات الاتصال الأساسية" (order 3) shows L1-S1 game -- **always unlocked** (first game)
- Topic "الطوبولوجيا" (order 8) shows L1-S2 -- locked until L1-S1 is completed
- Topics without matching games show no card at all (e.g., "مقدمة في شبكات الحاسوب")

