// app/routes/dashboard.tsx
import { type LoaderFunctionArgs, type MetaFunction } from "react-router";
import { data } from "react-router";
import { HomePage } from "../homepage/home.page";

export const meta: MetaFunction = () => {
    return [
        { title: "Dashboard - Fantasy Football Draft" },
        { name: "description", content: "Fantasy football league dashboard with top players and standings" },
    ];
};

export async function loader({ request }: LoaderFunctionArgs): Promise<Response> {
    try {
        // Dynamic import to keep server code on server
        const { getDashboardData } = await import("../homepage/server/dashboard.server");
        const dashboardData = await getDashboardData();
        return data(dashboardData);
    } catch (error) {
        console.error("Dashboard loader error:", error);
        throw new Response("Failed to load dashboard data", { status: 500 });
    }
}

export default HomePage
