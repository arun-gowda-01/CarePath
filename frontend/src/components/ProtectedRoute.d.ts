interface ProtectedRouteProps {
    children: React.ReactNode;
    roles?: string[];
}
declare const ProtectedRoute: ({ children, roles }: ProtectedRouteProps) => string | number | bigint | boolean | import("react/jsx-runtime").JSX.Element | Iterable<import("react").ReactNode> | Promise<string | number | bigint | boolean | import("react").ReactPortal | import("react").ReactElement<unknown, string | import("react").JSXElementConstructor<any>> | Iterable<import("react").ReactNode> | null | undefined> | null | undefined;
export default ProtectedRoute;
