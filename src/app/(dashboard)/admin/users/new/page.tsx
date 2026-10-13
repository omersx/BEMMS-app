import { redirect } from "next/navigation"

export default function AddUserPage() {
  redirect("/admin/users?action=new")
}
