import { type LoaderFunctionArgs } from "react-router";
import { useLoaderData } from "react-router";
import { testConnection } from "../_shared/lib/sheets/utils/common";

export async function loader({ request }: LoaderFunctionArgs) {
    const tests = [];

    // Test 1: Environment variables
    const envTest = {
        name: "Environment Variables",
        success: !!(process.env.GOOGLE_SHEETS_ID && process.env.GOOGLE_SERVICE_ACCOUNT_KEY),
        details: {
            hasGoogleSheetsId: !!process.env.GOOGLE_SHEETS_ID,
            hasServiceAccountKey: !!process.env.GOOGLE_SERVICE_ACCOUNT_KEY,
            sheetsIdLength: process.env.GOOGLE_SHEETS_ID?.length || 0,
            serviceKeyLength: process.env.GOOGLE_SERVICE_ACCOUNT_KEY?.length || 0,
        }
    };
    tests.push(envTest);

    // Test 2: JSON parsing
    let credentialsTest = {
        name: "Service Account JSON Parsing",
        success: false,
        details: {} as any
    };

    if (process.env.GOOGLE_SERVICE_ACCOUNT_KEY) {
        try {
            const decodedString = atob(process.env.GOOGLE_SERVICE_ACCOUNT_KEY);
            const parsed = JSON.parse(decodedString);

            credentialsTest = {
                name: "Service Account JSON Parsing",
                success: true,
                details: {
                    hasClientEmail: !!parsed.client_email,
                    hasPrivateKey: !!parsed.private_key,
                    hasProjectId: !!parsed.project_id,
                    clientEmail: parsed.client_email,
                    projectId: parsed.project_id,
                    privateKeyLength: parsed.private_key?.length || 0,
                }
            };
        } catch (error) {
            credentialsTest.details = {
                error: error instanceof Error ? error.message : 'Unknown error',
                firstChars: process.env.GOOGLE_SERVICE_ACCOUNT_KEY.substring(0, 50) + '...'
            };
        }
    }
    tests.push(credentialsTest);

    // Test 3: Google Sheets connection
    const connectionTest = {
        name: "Google Sheets Connection",
        success: false,
        details: {} as any
    };

    try {
        const result = await testConnection();
        connectionTest.success = result.success;
        connectionTest.details = { message: result.message };
    } catch (error) {
        connectionTest.details = {
            error: error instanceof Error ? error.message : 'Unknown error'
        };
    }
    tests.push(connectionTest);

    return { tests };
}

export default function DebugRoute() {
    const { tests } = useLoaderData<typeof loader>();

    return (
        <div style={{
            fontFamily: "Inter, system-ui, sans-serif",
            maxWidth: "800px",
            margin: "0 auto",
            padding: "20px"
        }}>
            <h1 style={{ color: "#37003c", marginBottom: "30px" }}>🔧 Debug Information</h1>

            {tests.map((test, index) => (
                <div key={index} style={{
                    backgroundColor: "white",
                    border: `2px solid ${test.success ? "#10b981" : "#ef4444"}`,
                    borderRadius: "12px",
                    padding: "20px",
                    marginBottom: "20px"
                }}>
                    <h3 style={{
                        margin: "0 0 15px 0",
                        color: test.success ? "#059669" : "#dc2626",
                        display: "flex",
                        alignItems: "center",
                        gap: "8px"
                    }}>
                        {test.success ? "✅" : "❌"} {test.name}
                    </h3>

                    <pre style={{
                        backgroundColor: "#f8fafc",
                        padding: "15px",
                        borderRadius: "8px",
                        fontSize: "14px",
                        overflow: "auto",
                        margin: 0
                    }}>
            {JSON.stringify(test.details, null, 2)}
          </pre>
                </div>
            ))}

            <div style={{
                backgroundColor: "#f8fafc",
                border: "1px solid #e2e8f0",
                borderRadius: "12px",
                padding: "20px",
                marginTop: "30px"
            }}>
                <h3 style={{ margin: "0 0 15px 0" }}>💡 Troubleshooting Tips</h3>
                <ul style={{ margin: 0, paddingLeft: "20px", lineHeight: "1.6" }}>
                    <li>If JSON parsing fails, check that your service account key is properly escaped</li>
                    <li>Make sure the service account email has "Editor" access to your Google Sheet</li>
                    <li>Verify the Google Sheets ID is correct (from the URL)</li>
                    <li>Check that Google Sheets API is enabled in your Google Cloud project</li>
                    <li>Ensure your Google Sheet has tabs named "UserTeams" and "WeeklyPoints"</li>
                </ul>
            </div>
        </div>
    );
}
