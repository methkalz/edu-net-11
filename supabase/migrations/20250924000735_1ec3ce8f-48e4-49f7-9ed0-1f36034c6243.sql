-- Add 3D models to existing Grade 10 lessons

-- Add 3D model for End Devices lesson
INSERT INTO grade10_lesson_media (
  lesson_id, 
  media_type, 
  file_path, 
  file_name, 
  metadata, 
  order_index
) VALUES 
(
  'e847f4b9-ece9-4200-812d-41ae4ae9687e', -- أجهزة طرفية (End Devices)
  '3d_model',
  'https://modelviewer.dev/shared-assets/models/Astronaut.glb',
  'end_device_model.glb',
  jsonb_build_object(
    'modelType', 'glb',
    'autoRotate', true,
    'description', 'نموذج ثلاثي الأبعاد لجهاز طرفي في الشبكة'
  ),
  1
),
(
  '49ee495b-b10a-44ea-90ce-c94389125491', -- أجهزة وسيطة (Intermediary Devices)
  '3d_model',
  'https://modelviewer.dev/shared-assets/models/NeilArmstrong.glb',
  'router_model.glb',
  jsonb_build_object(
    'modelType', 'glb',
    'autoRotate', false,
    'description', 'نموذج ثلاثي الأبعاد لجهاز توجيه (Router)'
  ),
  2
),
(
  '2113cc5d-b0ee-4d5a-b035-bcfb421dfbfc', -- البيئة الفيزيائية (Physical Topology)
  '3d_model',
  'https://modelviewer.dev/shared-assets/models/Horse.glb',
  'network_topology.glb',
  jsonb_build_object(
    'modelType', 'glb',
    'autoRotate', true,
    'description', 'نموذج ثلاثي الأبعاد للبيئة الفيزيائية للشبكة'
  ),
  3
);