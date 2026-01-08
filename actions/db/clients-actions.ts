"use server"

import { db } from "@/db/db"
import { clientsTable, type InsertClient, type SelectClient } from "@/db/schema"
import { ActionState } from "@/types"
import { eq } from "drizzle-orm"

export async function createClientAction(
  client: InsertClient
): Promise<ActionState<SelectClient>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [newClient] = await db.insert(clientsTable).values(client).returning()
    return {
      isSuccess: true,
      message: "Client created successfully",
      data: newClient
    }
  } catch (error) {
    console.error("Error creating client:", error)
    return { isSuccess: false, message: "Failed to create client" }
  }
}

export async function getClientsAction(): Promise<ActionState<SelectClient[]>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const clients = await db.select().from(clientsTable)
    return {
      isSuccess: true,
      message: "Clients retrieved successfully",
      data: clients
    }
  } catch (error) {
    console.error("Error getting clients:", error)
    return { isSuccess: false, message: "Failed to get clients" }
  }
}

export async function updateClientAction(
  id: string,
  data: Partial<InsertClient>
): Promise<ActionState<SelectClient>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    const [updatedClient] = await db
      .update(clientsTable)
      .set({ ...data, updatedAt: new Date() })
      .where(eq(clientsTable.id, id))
      .returning()

    return {
      isSuccess: true,
      message: "Client updated successfully",
      data: updatedClient
    }
  } catch (error) {
    console.error("Error updating client:", error)
    return { isSuccess: false, message: "Failed to update client" }
  }
}

export async function deleteClientAction(id: string): Promise<ActionState<void>> {
  try {
    if (!db) {
      return { isSuccess: false, message: "Database not available" }
    }
    await db.delete(clientsTable).where(eq(clientsTable.id, id))
    return {
      isSuccess: true,
      message: "Client deleted successfully",
      data: undefined
    }
  } catch (error) {
    console.error("Error deleting client:", error)
    return { isSuccess: false, message: "Failed to delete client" }
  }
}

