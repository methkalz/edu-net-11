-- حذف البطاقات المضافة حديثاً من لعبة مطابقة الكلمات
DELETE FROM public.pair_matching_games 
WHERE id IN (
    '8ce6030c-b33c-4c96-bb71-18384462f7bb',
    '269936b4-146d-4b61-854a-3a8f746970ad', 
    '0b4ed61e-8d0f-4186-85a1-0fa076791dcd'
);