import inquirer from "inquirer";
import { QueryResult } from 'pg';
import { pool, connectToDb } from '../connection.js'
import dotenv from 'dotenv'
import Table from 'cli-table3'

dotenv.config()

await connectToDb();

class Cli {
    
    viewAllEmployees(): void {
        pool.query(`SELECT e.id, e.first_name, e.last_name, roles.title, departments.department_name, roles.salary,
                    CONCAT(m.first_name, ' ', m.last_name) AS manager
                    FROM employees e 
                    JOIN roles ON e.role_id = roles.id 
                    JOIN departments ON roles.department = departments.id
                    LEFT JOIN employees m ON e.manager_id = m.id`, (err: Error, result: QueryResult) => {
            if (err) {
                console.log(err);
            } else if (result) {
                let table = new Table({ head: ["id", "first_name", "last_name", "title", "department", "salary", "manager"] });
                result.rows.forEach((row) => {
                    table.push(
                        [`${row.id}`, `${row.first_name}`,`${row.last_name}`, `${row.title}`, `${row.department_name}`, `${row.salary}`, `${row.manager}`]
                    )
                })
                
                console.log(table.toString());
                this.return();
            }
        });
    }

    private async addEmployee() {
        let roles: string[] = [];
        try{
            const result = await pool.query('SELECT title FROM roles')
            roles = result.rows.map((row) => row.title)
            } catch (err) {
                console.error('Error fetching roles:', err);
            }
        
        let managerOptions: string[] = [];

        try{
            const result = await pool.query(`SELECT CONCAT(first_name, ' ', last_name) AS employees FROM employees`)
            managerOptions = result.rows.map((row) => row.employees)
            managerOptions.push('None')
            } catch (err) {
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
    .then (async (answers:any) => {
        const firstName = answers.FirstName;
        const lastName = answers.LastName;
        let roleRow;
        let managerRow;
        const resultRole = await pool.query('SELECT * FROM roles');
        roleRow = await resultRole.rows.find((row) => {
            return row.title === answers.Role
        });
        const roleId = roleRow.id

    if (answers.Manager !== "None") {
        const resultManager = await pool.query('SELECT * FROM employees');
        managerRow = await resultManager.rows.find((row) => {
            let managerNameArray = answers.Manager.split(" ")
            return row.first_name === managerNameArray[0]
        });
        } else {
            managerRow = null
        }
        const managerId = managerRow ? managerRow.id : null;

        pool.query( `INSERT INTO employees (first_name, last_name, role_id, manager_id)
                     VALUES ($1, $2, $3, $4)`,
                    [firstName, lastName, roleId, managerId],
                    (err: Error, result: QueryResult) => {
                        if (err) {
                            console.log('Error adding employee to database:', err)
                            this.mainMenu();
                        } else if (result) {
                            console.log(`Added ${firstName} ${lastName} to database.`);
                            this.mainMenu();
                        };
                    });
    });
    }

    private async updateEmployeeRole() {
        let employeeOptions: string[] = [];

        try{
            const result = await pool.query(`SELECT CONCAT(first_name, ' ', last_name) AS employees FROM employees`)
            employeeOptions = result.rows.map((row) => row.employees)
            } catch (err) {
                console.error('Error fetching employees:', err);
            }
        
        let roles: string[] = [];

        try{
            const result = await pool.query('SELECT title FROM roles')
            roles = result.rows.map((row) => row.title)
            } catch (err) {
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
        .then (async (answers: any) => {
            let roleRow;
            
            const resultRole = await pool.query('SELECT * FROM roles');
            roleRow = await resultRole.rows.find((row) => {
                return row.title === answers.Role
            });
            const roleId = roleRow.id

            let employeeRow;
            const resultEmployee = await pool.query('SELECT * FROM employees');
            employeeRow = await resultEmployee.rows.find((row) => {
                let employeeNameArray = answers.Employee.split(" ")
                return row.first_name === employeeNameArray[0]
            });

            const employeeId = employeeRow.id
            pool.query(`UPDATE employees SET role_id = $1 WHERE id = $2`,
                        [roleId, employeeId],
                        (err: Error, result: QueryResult) => {
                            if (err) {
                                console.log('Error updating employee:', err)
                                this.mainMenu();
                            } else if (result) {
                                console.log(`Updated ${answers.Employee}'s role.`)
                                this.mainMenu();
                            };
                        });
        });
    }

    private async viewEmployeesByManager() {
        try {
            const managersResult = await pool.query(`
                SELECT DISTINCT m.id, m.first_name, m.last_name
                FROM employees e
                JOIN employees m ON e.manager_id = m.id
            `);
            const managers = managersResult.rows;
    
            if (managers.length === 0) {
                console.log('No managers found.');
                this.return();
                return;
            }

            const managerOptions = managers.map(manager => `${manager.first_name} ${manager.last_name}`);
            const answers = await inquirer.prompt([
                {
                    type: 'list',
                    name: 'Manager',
                    message: 'Select a manager to view their employees:',
                    choices: managerOptions
                }
            ]);
    
            const selectedManager = answers.Manager;
            const [managerFirstName, managerLastName] = selectedManager.split(' ');
    
            const result = await pool.query(`
                SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary,
                CONCAT(m.first_name, ' ', m.last_name) AS manager,
                mr.title AS manager_title, mr.salary AS manager_salary, md.department_name AS manager_department
                FROM employees e
                JOIN roles r ON e.role_id = r.id
                JOIN departments d ON r.department = d.id
                LEFT JOIN employees m ON e.manager_id = m.id
                LEFT JOIN roles mr ON m.role_id = mr.id
                LEFT JOIN departments md ON mr.department = md.id
                WHERE m.first_name = $1 AND m.last_name = $2
            `, [managerFirstName, managerLastName]);
    
            if (result.rows.length === 0) {
                console.log(`No employees found for manager ${selectedManager}.`);
                this.return();
                return;
            }
    
            let table = new Table({ head: ["ID", "First Name", "Last Name", "Title", "Department", "Salary", "Manager", "Manager Title", "Manager Salary", "Manager Department"] });
            result.rows.forEach((row) => {
                table.push(
                    [`${row.id}`, `${row.first_name}`, `${row.last_name}`, `${row.title}`, `${row.department_name}`, `${row.salary}`, `${row.manager}`, `${row.manager_title}`, `${row.manager_salary}`, `${row.manager_department}`]
                );
            });
    
            console.log(table.toString());
            this.return();
        } catch (err) {
            console.error('Error fetching employees by manager:', err);
            this.return();
        }
    }

    private async viewEmployeesByDepartment() {
        const result = await pool.query(`SELECT id, department_name FROM departments`)
        const departments = result.rows
        
        const departmentOptions = departments.map(department => department.department_name)

        inquirer.prompt([
            {
                type: 'list',
                name: 'Department',
                message: 'Choose a department to see their employees',
                choices: departmentOptions
            }
        ])
        .then (async (answers: any) => {
            pool.query(`
                SELECT e.id, e.first_name, e.last_name, r.title, d.department_name, r.salary
                FROM employees e
                JOIN roles r ON e.role_id = r.id
                JOIN departments d ON r.department = d.id
                LEFT JOIN employees m ON e.manager_id = m.id
                LEFT JOIN roles mr ON m.role_id = mr.id
                LEFT JOIN departments md ON mr.department = md.id
                WHERE d.department_name = $1
                `, [answers.Department], (err: Error, result: QueryResult) => {
                    let table = new Table({ head: ["ID", "First Name", "Last Name", "Title", "Department", "Salary", "Manager"] });
                    result.rows.forEach((row) => {
                        table.push(
                            [`${row.id}`, `${row.first_name}`, `${row.last_name}`, `${row.title}`, `${row.department_name}`, `${row.salary}`]
                        );
                    });
            
                    console.log(table.toString());
                    this.return();
                })
        })
    }

    private async deleteEmployee() {
        const result = await pool.query(`SELECT e.id, CONCAT(e.first_name, ' ', e.last_name) as name FROM employees e`)
        const employees = result.rows
        
        const employeeOptions = employees.map(employee => employee.name)

        inquirer.prompt([
            {
                type: 'list',
                name: 'Employee',
                message: 'Choose an employee to delete',
                choices: employeeOptions
            }
        ])
        .then (async (answers: any) => {
            
            const answerRow = employees.find((employee) => employee.name === answers.Employee)
           
            pool.query(`DELETE FROM employees WHERE id = $1`, [answerRow.id], (err: Error, result: QueryResult) => {
                if (err) {
                    console.log(err)
                    this.mainMenu()
                } else if (result) {
                    console.log(`${answers.Employee} has been deleted from the database.`)
                    this.mainMenu()
                }
            } )
        })
    }

    private viewAllRoles(): void {
        pool.query(`SELECT roles.id, roles.title, departments.department_name, roles.salary 
                    FROM roles 
                    JOIN departments ON roles.department = departments.id`, (err: Error, result: QueryResult) => {
            if (err) {
                console.log(err);
            } else if (result) {
                let table = new Table({ head: ["id", "title", "department", "salary"] });
                result.rows.forEach((row) => {
                    table.push(
                        [`${row.id}`, `${row.title}`, `${row.department_name}`, `${row.salary}`]
                    )
                })
             
                console.log(table.toString());
                this.return()
            }
        });
        
    }

   private async addRole(): Promise<void> {
    let departmentNames: string[] = [];
    try{
    const result = await pool.query('SELECT department_name FROM departments')
    departmentNames = result.rows.map((row) => row.department_name)
    } catch (err) {
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
    .then(async (answers:any) => {
        const name = answers.roleName
        const salary = answers.Salary
        let departmentRow;
        const result = await pool.query('SELECT * FROM departments')
        departmentRow = await result.rows.find((row) => {
            return row.department_name === answers.Department
        })
        const departmentId = departmentRow.id


        pool.query(`INSERT INTO roles (title, salary, department) 
                    VALUES ($1, $2, $3)`,
                    [name, salary, departmentId], 
                    (err: Error, result: QueryResult) => {
                            if (err) {
                                console.log(`Error adding department to database: ${err}`);
                                this.mainMenu();
                            } else if (result) {
                                console.log(`Added ${name} to database.`);
                                this.mainMenu();
                            };
                        });
    });
    }

    private async deleteRole() {
        const result = await pool.query(`SELECT roles.id, roles.title FROM roles`)
        const roles = result.rows
        
        const roleOptions = roles.map(role => role.title)

        inquirer.prompt([
            {
                type: 'list',
                name: 'Role',
                message: 'Choose a role to delete',
                choices: roleOptions
            }
        ])
        .then (async (answers: any) => {
            const answerRow = roles.find((role) => role.title === answers.Role)
            
            pool.query(`DELETE FROM roles WHERE id = $1`, [answerRow.id], (err: Error, result: QueryResult) => {
                if (err) {
                    console.log(err)
                    this.mainMenu()
                } else if (result) {
                    console.log(`${answers.Role} has been deleted from the database.`)
                    this.mainMenu()
                }
            } )
        })
    }

    private viewAllDepartments(): void {
        pool.query('TABLE departments', (err: Error, result: QueryResult) => {
            if (err) {
                console.log(err);
            } else if (result) {
                let table = new Table({ head: ["id", "name"] });
                result.rows.forEach((row) => {
                    table.push(
                        [`${row.id}`, `${row.department_name}`]
                    )
                })
                
                console.log(table.toString());
                this.return()
            };
        });
    }

    private addDepartment(): void {
        inquirer
            .prompt([
                {
                    type: 'input',
                    name: 'DepartmentName',
                    message: 'What is the name of the Department?'
                },
            ])
            .then((answers:any) => {
                const name = answers.DepartmentName
                pool.query('INSERT INTO departments (department_name) VALUES ($1)',
                            [name], 
                            (err: Error, result: QueryResult) => {
                                    if (err) {
                                        console.log(`Error adding department to database: ${err}`);
                                        this.mainMenu();
                                    } else if (result) {
                                        console.log(`Added ${name} to database.`);
                                        this.mainMenu();
                                    }
                                })
                

            })
    }

    private async deleteDepartment() {
        const result = await pool.query(`SELECT id, department_name FROM departments`)
        const departments = result.rows
        
        const departmentOptions = departments.map(department => department.department_name)

        inquirer.prompt([
            {
                type: 'list',
                name: 'Department',
                message: 'Choose a department to delete',
                choices: departmentOptions
            }
        ])
        .then (async (answers: any) => {
            const answerRow = departments.find((department) => department.department_name === answers.Department)
            console.log(answerRow.id);
            pool.query(`DELETE FROM departments WHERE id = $1`, [answerRow.id], (err: Error, result: QueryResult) => {
                if (err) {
                    console.log(err)
                    this.mainMenu()
                } else if (result) {
                    console.log(`${answers.Department} has been deleted from the database.`)
                    this.mainMenu()
                }
            } )
        })
    }

    private async totalUtilizedBudget() {
        const result = await pool.query(`SELECT id, department_name FROM departments`)
        const departments = result.rows
        
        const departmentOptions = departments.map(department => department.department_name)

        inquirer.prompt([
            {
                type: 'list',
                name: 'Department',
                message: 'Choose a department to see their employees',
                choices: departmentOptions
            }
        ])
        .then (async (answers: any) => {
            pool.query(`
                SELECT SUM(r.salary) as sum_salary, d.department_name FROM employees e JOIN roles r ON e.role_id = r.id
                JOIN departments d ON r.department = d.id WHERE d.department_name = $1 GROUP BY department_name 
                `, [answers.Department], (err: Error, result: QueryResult) => {
                    if (err) {
                        console.log(err)
                    } else if (result) {
                    let table = new Table({ head: [`Sum budget of ${answers.Department}`] });
                    result.rows.forEach((row) => {
                        table.push(
                            [`$${row.sum_salary}`]
                        );
                    });
            
                    console.log(table.toString());
                    this.return();
                }
                })
        })
    }

    private return(): void {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'ReturnOrQuit',
                    message: 'Return to the main',
                    choices: ['Return', 'Quit'],
                },
            ])
            .then((answers:any) => {
                if (answers.ReturnOrQuit === 'Return') {
                    this.mainMenu();
                } else (
                    process.exit()
                )
            })
    }

    private mainMenu(): void {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'SelectAction',
                    message: 'What would you like to do?',
                    choices: ['View All Employees', 'Add Employee', 'Update Employee Role', 'View Employees By Manager',
                        'View Employees By Department', 
                        'Delete Employee','View All Roles' ,
                        'Add Role', 'Delete Role', 'View All Departments', 'Add Department', 'Delete Department', 'Total Utilized Budget of Department',  'Quit'],
                },
            ])
            .then( (answers: any) => {
                if (answers.SelectAction === 'View All Employees') {
                    this.viewAllEmployees();
                }
                else if (answers.SelectAction === 'Add Employee') {
                    this.addEmployee();
                } else if (answers.SelectAction === 'Update Employee Role') {
                    this.updateEmployeeRole();
                } else if (answers.SelectAction === 'View Employees By Manager') {
                    this.viewEmployeesByManager();
                } else if (answers.SelectAction === 'View Employees By Department') {
                    this.viewEmployeesByDepartment();
                } else if (answers.SelectAction === 'Delete Employee') {
                    this.deleteEmployee();
                } else if (answers.SelectAction === 'View All Roles') {
                    this.viewAllRoles(); 
                } else if (answers.SelectAction === 'Add Role') {
                    this.addRole();
                }  else if (answers.SelectAction === 'Delete Role') {
                    this.deleteRole();
                } else if (answers.SelectAction === 'View All Departments') {
                    this.viewAllDepartments();
                } else if (answers.SelectAction === 'Add Department') {
                    this.addDepartment();
                }  else if (answers.SelectAction === 'Delete Department') {
                    this.deleteDepartment();
                } else if (answers.SelectAction === 'Total Utilized Budget of Department') {
                    this.totalUtilizedBudget();
                } else if (answers.SelectAction === 'Quit') {
                    process.exit();
                }
            })
    }
    startCli(): void {
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

export default Cli