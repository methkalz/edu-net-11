CREATE POLICY "Users can delete their own comparison results"
ON public.pdf_comparison_results
FOR DELETE
TO authenticated
USING (
  requested_by = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.profiles
    WHERE profiles.user_id = auth.uid()
      AND profiles.role = 'superadmin'::app_role
  )
  OR (
    school_id = (SELECT profiles.school_id FROM public.profiles WHERE profiles.user_id = auth.uid())
    AND EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.user_id = auth.uid()
        AND profiles.role = 'school_admin'::app_role
    )
  )
);