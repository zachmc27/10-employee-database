import inquirer from "inquirer";
import { QueryResult } from 'pg';
import { pool, connectToDb } from '../connection.js'
import dotenv from 'dotenv'

dotenv.config()

await connectToDb();

class Cli {

    exit: boolean = false

    addEmployee(): void {

    }

    updateEmployeeRole(): void {

    }

    viewAllRoles(): void {
        
    }

    addRole(): void {

    }

    viewAllDepartments(): void {
        
    }

    addDepartment(): void {

    }

    startCli(): void {
        inquirer
            .prompt([
                {
                    type: 'list',
                    name: 'SelectAction',
                    message: 'What would you like to do?',
                    choices: ['Add Employee', 'Update Employee Role', 'View All Roles',
                        'Add Role', 'View All Departments', 'Add Department', 'Quit'],
                },
            ])
            .then((answers: any) => {
                if (answers.SelectAction === 'Add Employee') {

                } else if (answers.SelectAction === 'Update Employee Role') {

                } else if (answers.SelectAction === 'View All Roles') {

                } else if (answers.SelectAction === 'Add Role') {

                } else if (answers.SelectAction === 'View All Departments') {

                } else if (answers.SelectAction === 'Add Department') {

                } else if (answers.SelectAction === 'Quit') {

                }
            })
    }
}

export default Cli