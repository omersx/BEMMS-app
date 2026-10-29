import { redirect } from "next/navigation";

export default function AdminDevicesRedirectPage() {
  redirect("/devices");
}
