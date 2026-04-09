import express, { Application } from "express";
import cors from "cors";
import path from "path";
import { errorHandler } from "./_middleware/errorHandler";
import { initialize } from "./_helpers/db";
import usersController from "./users/users.controller";
import employeesController from "./employees/employees.controller";
import departmentsController from "./departments/departments.controller";
import requestsController from "./requests/requests.controller";

const app: Application = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Serve compiled frontend from /public
app.use(express.static(path.join(__dirname, "../public")));

app.use("/users", usersController);
app.use("/employees", employeesController);
app.use("/departments", departmentsController);
app.use("/requests", requestsController);

app.use(errorHandler);

const PORT = process.env.PORT || 4000;

initialize()
    .then(() => {
        app.listen(PORT, () => {
            console.log(`Server running on http://localhost:${PORT}`);
        });
    })
    .catch((err) => {
        console.error("Failed to initialize database:", err);
        process.exit(1);
    });
