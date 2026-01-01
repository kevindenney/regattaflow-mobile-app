-- Update "What is Sailboat Racing?" lesson to use the interactive component
UPDATE learning_lessons
SET lesson_type = 'interactive',
    interactive_component = 'WhatIsSailboatRacingInteractive',
    video_url = NULL
WHERE id = 'deae333e-7dcc-424f-857d-33f8b3df5d06';
