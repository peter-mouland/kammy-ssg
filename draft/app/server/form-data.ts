import { type ActionFunctionArgs } from "react-router";

export async function requestFormData({ context }: ActionFunctionArgs['context']): Promise<URLSearchParams> {
        // does not work in firebase
        // const formData = await request.formData();
        // actionType = formData.get("actionType") as string | null;
        // divisionId = formData.get("divisionId") as string | null;

        return { get: (name) => context[name] }
}
