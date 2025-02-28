import inquirer from "inquirer";
import { pool, connectToDb } from '../connection.js';
import dotenv from 'dotenv';
import Table from 'cli-table3';
dotenv.config();
await connectToDb();
class Cli {
    viewAllEmployees() {
        pool.query(`SELECT e.id, e.first_name, e.last_name, roles.title, departments.department_name, roles.salary,
                    CONCAT(m.first_name, ' ', m.last_name) AS manager
                    FROM employees e 
                    JOIN roles ON e.role_id = roles.id 
                    JOIN departments ON roles.department = departments.id
                    LEFT JOIN employees m ON e.manager_id = m.id`, (err, result) => {
            if (err) {
                console.log(err);
            }
            else if (result) {
                let table = new Table({ head: ["id", "first_name", "last_name", "title", "department", "salary", "manager"] });
                result.rows.forEach((row) => {
                    table.push([`${row.id}`, `${row.first_name}`, `${row.last_name}`, `${row.title}`, `${row.department_name}`, `${row.salary}`, `${row.manager}`]);
                });
                console.log(table.toString());
                this.return();
            }
        });
    }
    async addEmployee() {
        let roles = [];
        try {
            const result = await pool.query('SELECT title FROM roles');
            roles = result.rows.map((row) => row.title);
        }
        catch (err) {
            console.error('Error fetching roles:', err);
        }
        let managerOptions = [];
        try {
            const result = await pool.query(`SELECT CONCAT(first_name, ' ', last_name) AS employees FROM employees`);
            managerOptions = result.rows.map((row) => row.employees);
            managerOptions.push('None');
        }
        catch (err) {
            console.error('Error fetching employees:', err);
        }
        inquirer
            .prompt([
            {
                type: 'input',
                name: 'FirstName',
                message: 'What is the employees first name?'
            },
            {
                type: 'input',
                name: 'LastName',
                message: 'What is the employees last name?'
            },
            {
                type: 'list',
                name: 'Role',
                message: 'What is the employees role?',
                choices: roles
            },
            {
                type: 'list',
                name: 'Manager',
                message: 'Who is the employees manager?',
                choices: managerOptions
            }
        ])
            .then(async (answers) => {
            const firstName = answers.FirstName;
            const lastName = answers.LastName;
            let roleRow;
            let managerRow;
            const resultRole = await pool.query('SELECT * FROM roles');
            roleRow = await resultRole.rows.find((row) => {
                return row.title === answers.Role;
            });
            const roleId = roleRow.id;
            if (answers.Manager !== "None") {
                const resultManager = await pool.query('SELECT * FROM employees');
                managerRow = await resultManager.rows.find((row) => {
                    let managerNameArray = answers.Manager.split(" ");
                    return row.first_name === managerNameArray[0];
                });
            }
            else {
                managerRow = null;
            }
            const managerId = managerRow ? managerRow.id : null;
            pool.query(`INSERT INTO employees (first_name, last_name, role_id, manager_id)
                     VALUES ($1, $2, $3, $4)`, [firstName, lastName, roleId, managerId], (err, result) => {
                if (err) {
                    console.log('Error adding employee to database:', err);
                    this.mainMenu();
                }
                else if (result) {
                    console.log(`Added ${firstName} ${lastName} to database.`);
                    this.mainMenu();
                }
                ;
            });
        });
    }
    async updateEmployeeRole() {
        let employeeOptions = [];
        try {
            const result = await pool.query(`SELECT CONCAT(first_name, ' ', last_name) AS employees FROM employees`);
            employeeOptions = result.rows.map((row) => row.employees);
        }
        catch (err) {
            console.error('Error fetching employees:', err);
        }
        let roles = [];
        try {
            const result = await pool.query('SELECT title FROM roles');
            roles = result.rows.map((row) => row.title);
        }
        catch (err) {
            console.error('Error fetching roles:', err);
        }
        inquirer
            .prompt([
            {
                type: 'list',
                name: 'Employee',
                message: `Which employee's role do you want to update?`,
                choices: employeeOptions
            },
            {
                type: 'list',
                name: 'Role',
                message: 'Which role do you want to assign the selected employee?',
                choices: roles
            }
        ])
            .then(async (answers) => {
            let roleRow;
            const resultRole = await pool.query('SELECT * FROM roles');
            roleRow = await resultRole.rows.find((row) => {
                return row.title === answers.Role;
            });
            const roleId = roleRow.id;
            let employeeRow;
            const resultEmployee = await pool.query('SELECT * FROM employees');
            employeeRow = await resultEmployee.rows.find((row) => {
                let employeeNameArray = answers.Employee.split(" ");
                return row.first_name === employeeNameArray[0];
            });
            const employeeId = employeeRow.id;
            pool.query(`UPDATE employees SET role_id = $1 WHERE id = $2`, [roleId, employeeId], (err, result) => {
                if (err) {
                    console.log('Error updating employee:', err);
                    this.mainMenu();
                }
                else if (result) {
                    console.log(`Updated ${answers.Employee}'s role.`);
                    this.mainMenu();
                }
                ;
            });
        });
    }
    viewAllRoles() {
        pool.query(`SELECT roles.id, roles.title, departments.department_name, roles.salary 
                    FROM roles 
                    JOIN departments ON roles.department = departments.id`, (err, result) => {
            if (err) {
                console.log(err);
            }
            else if (result) {
                let table = new Table({ head: ["id", "title", "department", "salary"] });
                result.rows.forEach((row) => {
                    table.push([`${row.id}`, `${row.title}`, `${row.department_name}`, `${row.salary}`]);
                });
                console.log(table.toString());
                this.return();
            }
        });
    }
    async addRole() {
        let departmentNames = [];
        try {
            const result = await pool.query('SELECT department_name FROM departments');
            departmentNames = result.rows.map((row) => row.department_name);
        }
        catch (err) {
            console.error('Error fetching departments:', err);
        }
        inquirer
            .prompt([
            {
                type: 'input',
                name: 'roleName',
                message: 'What is the name of the role?'
            },
            {
                type: 'input',
                name: 'Salary',
                message: 'What is the salary of the role?'
            },
            {
                type: 'list',
                name: 'Department',
                message: 'Which department does the role belong to?',
                choices: departmentNames
            }
        ])
            .then(async (answers) => {
            const name = answers.roleName;
            const salary = answers.Salary;
            let departmentRow;
            const result = await pool.query('SELECT * FROM departments');
            departmentRow = await result.rows.find((row) => {
                return row.department_name === answers.Department;
            });
            const departmentId = departmentRow.id;
            pool.query(`INSERT INTO roles (title, salary, department) 
                    VALUES ($1, $2, $3)`, [name, salary, departmentId], (err, result) => {
                if (err) {
                    console.log(`Error adding department to database: ${err}`);
                    this.mainMenu();
                }
                else if (result) {
                    console.log(`Added ${name} to database.`);
                    this.mainMenu();
                }
                ;
            });
        });
    }
    viewAllDepartments() {
        pool.query('TABLE departments', (err, result) => {
            if (err) {
                console.log(err);
            }
            else if (result) {
                let table = new Table({ head: ["id", "name"] });
                result.rows.forEach((row) => {
                    table.push([`${row.id}`, `${row.department_name}`]);
                });
                console.log(table.toString());
                this.return();
            }
            ;
        });
    }
    addDepartment() {
        inquirer
            .prompt([
            {
                type: 'input',
                name: 'DepartmentName',
                message: 'What is the name of the Department?'
            },
        ])
            .then((answers) => {
            const name = answers.DepartmentName;
            pool.query('INSERT INTO departments (department_name) VALUES ($1)', [name], (err, result) => {
                if (err) {
                    console.log(`Error adding department to database: ${err}`);
                    this.mainMenu();
                }
                else if (result) {
                    console.log(`Added ${name} to database.`);
                    this.mainMenu();
                }
            });
        });
    }
    return() {
        inquirer
            .prompt([
            {
                type: 'list',
                name: 'ReturnOrQuit',
                message: 'Return to the main',
                choices: ['Return', 'Quit'],
            },
        ])
            .then((answers) => {
            if (answers.ReturnOrQuit === 'Return') {
                this.mainMenu();
            }
            else
                (process.exit());
        });
    }
    mainMenu() {
        inquirer
            .prompt([
            {
                type: 'list',
                name: 'SelectAction',
                message: 'What would you like to do?',
                choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View All Roles',
                    'Add Role', 'View All Departments', 'Add Department', 'Quit'],
            },
        ])
            .then((answers) => {
            if (answers.SelectAction === 'View All Employees') {
                this.viewAllEmployees();
            }
            else if (answers.SelectAction === 'Add Employee') {
                this.addEmployee();
            }
            else if (answers.SelectAction === 'Update Employee Role') {
                this.updateEmployeeRole();
            }
            else if (answers.SelectAction === 'View All Roles') {
                this.viewAllRoles();
            }
            else if (answers.SelectAction === 'Add Role') {
                this.addRole();
            }
            else if (answers.SelectAction === 'View All Departments') {
                this.viewAllDepartments();
            }
            else if (answers.SelectAction === 'Add Department') {
                this.addDepartment();
            }
            else if (answers.SelectAction === 'Quit') {
                process.exit();
            }
        });
    }
    startCli() {
        console.log(`
            .-----------------------------------------------.
            | _____                 _                       |
            || ____|_ __ ___  _ __ | | ___  _   _  ___  ___ |
            ||  _| | '_ \` _ \\| '_ \\| |/ _ \\| | | |/ _ \\/ _ \\|
            || |___| | | | | | |_) | | (_) | |_| |  __/  __/|
            ||_____|_| |_| |_| .__/|_|\\___/ \\__, |\\___|\\___||
            ||  \\/  | __ _ _ |_|  __ _  __ _|___/ _ __      |
            || |\\/| |/ _\` | '_ \\ / _\` |/ _\` |/ _ \\ '__|     |
            || |  | | (_| | | | | (_| | (_| |  __/ |        |
            ||_|  |_|\\__,_|_| |_|\\__,_|\\__, |\\___|_|        |
            |                          |___/                |
            '-----------------------------------------------'
            `);
        this.mainMenu();
    }
}
export default Cli;
