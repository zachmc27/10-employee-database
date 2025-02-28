DO $$ 
    DECLARE

    BEGIN

        INSERT INTO departments (department_name)
        VALUES  ('Sales'),
                ('Engineering'),
                ('Finance'),
                ('Legal');

        INSERT INTO roles (title, salary, department)
        VALUES  ('Sales Lead', 100000, 1),
                ('Salesperson', 80000, 1),
                ('Lead Engineer', 150000, 2),
                ('Software Engineer', 120000, 2),
                ('Account Manager', 160000, 3),
                ('Accountant', 125000, 3),
                ('Legal Team Lead', 250000, 4),
                ('Lawyer', 190000, 4);
            
        INSERT INTO employees (first_name, last_name, role_id, manager_id)
        VALUES  ('Michael', 'Jackson', 1, null),
                ('Lebron', 'James', 2, 1),
                ('Ariana', 'Grande', 3, null),
                ('Kendrick', 'Duckworth', 4, 3),
                ('Jermaine', 'Cole', 5, null),
                ('Patrick', 'Mahomes', 6, 5),
                ('Chappel', 'Roan', 7, null),
                ('Kevin', 'Hart', 8, 7);

RAISE NOTICE 'Transaction Complete';

EXCEPTION 
    WHEN OTHERS THEN
        RAISE NOTICE 'An error occured: %', SQLERRM;
        ROLLBACK;
END $$;


                