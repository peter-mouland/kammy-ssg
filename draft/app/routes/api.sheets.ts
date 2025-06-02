import { type ActionFunctionArgs } from "react-router";
import { data } from "react-router";
import { readUserTeams, addUserTeam, updateUserTeam, deleteUserTeam } from "./server/sheets/user-teams";
import { readDivisions, addDivision, updateDivision, deleteDivision } from "./server/sheets/divisions";
import { readDraftPicks, addDraftPick } from "./server/sheets/draft";
import { readDraftOrders, generateRandomDraftOrder } from "./server/sheets/draft-order";
import type { ApiResponse } from "../types";

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
    try {
        const { method } = request;
        const url = new URL(request.url);
        const operation = url.searchParams.get("operation");
        const entity = url.searchParams.get("entity");

        if (method === "GET") {
            // Handle read operations
            switch (entity) {
                case "divisions":
                    const divisions = await readDivisions();
                    return data<ApiResponse<typeof divisions>>({
                        success: true,
                        data: divisions
                    });

                case "userTeams":
                    const userTeams = await readUserTeams();
                    return data<ApiResponse<typeof userTeams>>({
                        success: true,
                        data: userTeams
                    });

                case "draftPicks":
                    const divisionId = url.searchParams.get("divisionId");
                    if (!divisionId) {
                        return data<ApiResponse<null>>({
                            success: false,
                            error: "Division ID is required for draft picks"
                        }, { status: 400 });
                    }

                    const draftPicks = await readDraftPicks();
                    const filteredPicks = draftPicks.filter(pick => pick.divisionId === divisionId);

                    return data<ApiResponse<typeof filteredPicks>>({
                        success: true,
                        data: filteredPicks
                    });

                case "draftOrders":
                    const draftOrderDivisionId = url.searchParams.get("divisionId");
                    if (!draftOrderDivisionId) {
                        return data<ApiResponse<null>>({
                            success: false,
                            error: "Division ID is required for draft orders"
                        }, { status: 400 });
                    }

                    const draftOrders = await readDraftOrders();
                    const filteredOrders = draftOrders.filter(order => order.divisionId === draftOrderDivisionId);

                    return data<ApiResponse<typeof filteredOrders>>({
                        success: true,
                        data: filteredOrders
                    });

                default:
                    return data<ApiResponse<null>>({
                        success: false,
                        error: "Unknown entity type"
                    }, { status: 400 });
            }
        }

        if (method === "POST") {
            const body = await request.json();

            switch (operation) {
                case "create":
                    switch (entity) {
                        case "division":
                            await addDivision(body);
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "Division created successfully"
                            });

                        case "userTeam":
                            await addUserTeam(body);
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "User team created successfully"
                            });

                        case "draftPick":
                            await addDraftPick(body);
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "Draft pick added successfully"
                            });

                        default:
                            return data<ApiResponse<null>>({
                                success: false,
                                error: "Unknown entity type for creation"
                            }, { status: 400 });
                    }

                case "update":
                    const updateId = body.id;
                    if (!updateId) {
                        return data<ApiResponse<null>>({
                            success: false,
                            error: "ID is required for updates"
                        }, { status: 400 });
                    }

                    switch (entity) {
                        case "division":
                            const divisionUpdated = await updateDivision(updateId, body);
                            if (!divisionUpdated) {
                                return data<ApiResponse<null>>({
                                    success: false,
                                    error: "Division not found"
                                }, { status: 404 });
                            }
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "Division updated successfully"
                            });

                        case "userTeam":
                            const teamUpdated = await updateUserTeam(updateId, body);
                            if (!teamUpdated) {
                                return data<ApiResponse<null>>({
                                    success: false,
                                    error: "User team not found"
                                }, { status: 404 });
                            }
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "User team updated successfully"
                            });

                        default:
                            return data<ApiResponse<null>>({
                                success: false,
                                error: "Unknown entity type for update"
                            }, { status: 400 });
                    }

                case "delete":
                    const deleteId = body.id;
                    if (!deleteId) {
                        return data<ApiResponse<null>>({
                            success: false,
                            error: "ID is required for deletion"
                        }, { status: 400 });
                    }

                    switch (entity) {
                        case "division":
                            const divisionDeleted = await deleteDivision(deleteId);
                            if (!divisionDeleted) {
                                return data<ApiResponse<null>>({
                                    success: false,
                                    error: "Division not found"
                                }, { status: 404 });
                            }
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "Division deleted successfully"
                            });

                        case "userTeam":
                            const teamDeleted = await deleteUserTeam(deleteId);
                            if (!teamDeleted) {
                                return data<ApiResponse<null>>({
                                    success: false,
                                    error: "User team not found"
                                }, { status: 404 });
                            }
                            return data<ApiResponse<null>>({
                                success: true,
                                message: "User team deleted successfully"
                            });

                        default:
                            return data<ApiResponse<null>>({
                                success: false,
                                error: "Unknown entity type for deletion"
                            }, { status: 400 });
                    }

                case "generateDraftOrder":
                    const { divisionId, userTeams } = body;
                    if (!divisionId || !userTeams) {
                        return data<ApiResponse<null>>({
                            success: false,
                            error: "Division ID and user teams are required"
                        }, { status: 400 });
                    }

                    await generateRandomDraftOrder(divisionId, userTeams);
                    return data<ApiResponse<null>>({
                        success: true,
                        message: "Draft order generated successfully"
                    });

                default:
                    return data<ApiResponse<null>>({
                        success: false,
                        error: "Unknown operation"
                    }, { status: 400 });
            }
        }

        return data<ApiResponse<null>>({
            success: false,
            error: "Method not allowed"
        }, { status: 405 });

    } catch (error) {
        console.error("Sheets API error:", error);
        return data<ApiResponse<null>>({
            success: false,
            error: error instanceof Error ? error.message : "Unknown error occurred"
        }, { status: 500 });
    }
}
