import { redirect } from "next/navigation";

/**
 * The old Phase 1 proof-of-concept scene used to live here. It has been
 * superseded by the Main Entrance and the full park, so the root URL now just
 * sends visitors to the entrance.
 */
export default function Home() {
  redirect("/entrance");
}
