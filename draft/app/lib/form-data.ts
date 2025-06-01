import { type ActionFunctionArgs } from "react-router";

export async function requestFormData({ request, context }: ActionFunctionArgs['context']): Promise<URLSearchParams> {
        // does not work in firebase
        const formData = await request.formData();
        return {
            get: (name) => {
                const v = context[name] // needed for firebase
                if (v) {
                    return v
                }
                return formData.get(name) // needed for react-router-v7
            }
        }
}
