USE uni_db;

-- Insert faculties
INSERT INTO faculte (nom_faculte) VALUES
    ('Faculty of Computer Science'),
    ('Faculty of Engineering');

-- Insert departments
INSERT INTO Departement (ID_faculte, Nom_departement) VALUES
    (1, 'Computer Science Department'),
    (1, 'Information Systems Department'),
    (2, 'Electrical Engineering');

-- Insert specializations
INSERT INTO Specialite (ID_departement, nom_specialite) VALUES
    (1, 'Software Engineering'),
    (1, 'Artificial Intelligence'),
    (2, 'Network Systems'),
    (3, 'Power Systems');

-- Insert sections
INSERT INTO Section (ID_specialite, niveau) VALUES
    (1, 'L3'), (1, 'L3'), (2, 'M1'), (3, 'L2'), (4, 'ING2');

-- Insert rooms
INSERT INTO Salle (ID_salle, disponible, capacite) VALUES
    (128, TRUE, 50),
    (201, TRUE, 30),
    (305, TRUE, 45);

-- Insert semesters
INSERT INTO Semestre (date_debut, date_fin) VALUES
    ('2024-09-01', '2025-01-31');

-- Insert modules
INSERT INTO Module (nom_module, credit, coefficient, ID_specialite) VALUES
    ('COMPIL', 4, 3, 1),
    ('GL', 3, 2, 1),
    ('Network Fundamentals', 5, 4, 3),
    ('Power Distribution', 4, 3, 4),
    ('Machine Learning', 4, 3, 2),
    ('Deep Learning', 5, 4, 2),
    ('Natural Language Processing', 4, 3, 2);

-- Insert module-section relationships
INSERT INTO Module_Section (ID_module, ID_section) VALUES
    (1, 1), (2, 1), (3, 4), (4, 5),
    (5, 3), (6, 3), (7, 3);

-- Insert room-section relationships
INSERT INTO Salle_Section (ID_salle, ID_section) VALUES
    (128, 1), (201, 1);

-- Insert exams
INSERT INTO Exam (ID_module, ID_section, exam_date, time_slot, ID_salle, ID_semestre, status) VALUES
    (5, 3, '2025-03-10', '09:40 - 11:10', 128, 1, 'draft'),
    (6, 3, '2025-03-12', '13:00 - 14:30', 201, 1, 'draft'),
    (7, 3, '2025-03-15', '11:20 - 12:50', 305, 1, 'draft'),
    (1, 1, '2025-01-07', '13:00 - 14:30', 128, 1, 'draft'),
    (2, 1, '2025-01-09', '13:00 - 14:30', 128, 1, 'draft'),
    (3, 1, '2025-01-13', '09:40 - 11:10', 201, 1, 'draft');