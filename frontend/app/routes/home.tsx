import { useEffect, useState } from "react";
import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "New React Router App" },
    { name: "description", content: "Welcome to React Router!" },
  ];
}

export const clientLoader = async () => {
  const response = await fetch('http://localhost:8000');
  const data = await response.json();
  return { message: data.message};
};

export default function Home({ loaderData}: Route.ComponentProps) {
  const [message, setMessage] = useState<string>(loaderData.message);

  return (
    <div>
      <h1>
        {message}
      </h1>
    </div>
  );
}
