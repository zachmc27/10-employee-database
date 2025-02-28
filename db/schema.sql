DROP DATABASE IF EXISTS employees_db;
CREATE DATABASE employees_db;

\c employees_db

CREATE TABLE departments (
    id SERIAL PRIMARY KEY,
    department_name VARCHAR(30) NOT NULL
);

CREATE TABLE roles (
    id SERIAL PRIMARY KEY,
    title VARCHAR(100),
    salary DECIMAL,
    department INTEGER REFERENCES departments(id)
    ON DELETE SET NULL
);

CREATE TABLE employees (
    id SERIAL PRIMARY KEY,
    first_name VARCHAR(30),
    last_name VARCHAR(30),
    role_id INTEGER REFERENCES roles(id)
    ON DELETE SET NULL,
    manager_id INTEGER REFERENCES employees(id)
    ON DELETE SET NULL
)

