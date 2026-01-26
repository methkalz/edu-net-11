
-- Update Question 14 (all versions) with word_bank
UPDATE bagrut_questions 
SET correct_answer_data = COALESCE(correct_answer_data, '{}'::jsonb) || '{"word_bank": ["TCP", "UDP", "HTTP", "HTTPS", "DNS", "DHCP", "ICMP", "Telnet", "ARP", "FTP", "PING"]}'::jsonb
WHERE question_number = '14' 
  AND question_text LIKE '%استخدموا الكلمات الموجودة في المخزن%';

-- Update Question 2 with word_bank (preserving existing blanks)
UPDATE bagrut_questions 
SET correct_answer_data = COALESCE(correct_answer_data, '{}'::jsonb) || '{"word_bank": ["TCP", "UDP", "80", "443", "21", "53", "HTTP", "HTTPS", "FTP", "DNS"]}'::jsonb
WHERE id = '1fd062a7-172b-4f42-a699-3ddd8b6275fc';
