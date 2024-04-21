import { SupabaseClient, User } from "@supabase/supabase-js"
import { assign, fromCallback, fromPromise, setup } from "xstate"

import { logger } from "@/logger"
import { Database, Tables } from "@/supabase/types"

import { createPairingCode, redeemPairingCode } from "./actions"
import { connectCallerPeerMachine } from "../connect-caller-peer"
import { connectReceiverPeerMachine } from "../connect-receiver-peer"

type Input = {
  supabase: SupabaseClient<Database>
  currentUser: User
}

interface Context extends Input {
  createdCode?: Awaited<ReturnType<typeof createPairingCode>>
  redeemCode?: string
  remoteUserId?: string
  peerConnection?: RTCPeerConnection
}

type Event =
  | {
      type: "create-code"
    }
  | {
      type: "redemption-received"
      remoteUserId: string
    }
  | {
      type: "redeem-code"
      code: string
    }

export const newConnectionMachine = setup({
  types: {
    context: {} as Context,
    input: {} as Input,
    events: {} as Event,
    children: {} as {
      connectCallerPeerMachine: "connectCallerPeerMachine"
    },
  },

  actions: {
    setCreatedCodeToContext: assign({
      createdCode: (
        _,
        pairingCode: Awaited<ReturnType<typeof createPairingCode>>,
      ) => pairingCode,
    }),
    setRedeemCodeToContext: assign({
      redeemCode: (_, redeemCode: string) => redeemCode,
    }),
    createPeer: assign({
      peerConnection: () => new RTCPeerConnection(),
    }),
    saveRemoteUserIdToContext: assign({
      remoteUserId: (_, remoteUserId: string) => remoteUserId,
    }),
  },

  actors: {
    connectCallerPeerMachine,
    connectReceiverPeerMachine,
    createCode: fromPromise(() => createPairingCode()),
    listenForRedemptions: fromCallback<{ type: "noop" }, Context>((params) => {
      const sendBack = params.sendBack as (event: Event) => void
      const { supabase, createdCode } = params.input

      const channel = supabase
        .channel(Math.random().toString().substring(2, 20))
        .on(
          "postgres_changes",
          {
            event: "INSERT",
            schema: "public",
            table: "pairing_code_redemptions",
            filter: `${"pairing_code" satisfies keyof Tables<"pairing_code_redemptions">}=eq.${createdCode!.code}`,
          },
          (payload) => {
            const newRow = payload.new as Tables<"pairing_code_redemptions">
            sendBack({
              type: "redemption-received",
              remoteUserId: newRow.user_id,
            })
          },
        )
        .subscribe((status, err) => {
          logger.info(
            "[home] Listening to pairing code redemption status:",
            status,
          )
          if (err)
            logger.error(
              "[home] Error listening to pairing code redemption",
              err,
            )
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }),
    createUserConnection: fromPromise<void, Context>(
      async ({ input: { currentUser, supabase, remoteUserId } }) => {
        const { error } = await supabase.from("user_connections").upsert(
          {
            user_1_id: currentUser.id,
            user_2_id: remoteUserId!,
          },
          {
            onConflict: `${"user_1_id" satisfies keyof Tables<"user_connections">},${"user_2_id" satisfies keyof Tables<"user_connections">}"`,
          },
        )

        if (error) {
          logger.error("[new-connection] Error creating user connection", error)
          throw error
        }
      },
    ),
    redeemCode: fromPromise(({ input }: { input: Context }) =>
      redeemPairingCode(input.redeemCode!),
    ),
    cleanup: fromCallback(({ input }: { input: Context }) => {
      return () => {
        const { peerConnection } = input
        peerConnection?.close()
      }
    }),
  },
}).createMachine({
  /** @xstate-layout N4IgpgJg5mDOIC5QDswHcC0BjA9s1WALgJZ4B0xEANmAMRYBOYAhoWNjhGANoAMAuolAAHHLGIk8QkAA9EARgBMAVjLLeG+esUAWAOwAOZQDYdAGhABPRIoCcqlRt57jtg-L2KAzDoC+vi1RMXHwwIlJkCmo6Ji4wAFsOLj5BJBBRcUlkaTkEJVV1TW19I1MLazzFAzVvHR15Yy95XgaDf0D0DlDw8kYWEmQoAAJcLloIPDAKZAA3HABrKaCugiyyPtZiQZHOMAQtuaxNvBSU6QyJCJzEEx0yYz15W3kvRV4vPUMvcps9LzJPj4dI0vI1jO52iBliFVhEyFRiLA2MgtsMAGY4BhDWIJYRZWC0HHxPERDBMLBgYgzSBnNIXLLXPK8VxkZq2HS6XTGeTyAwGH4IFTVPS2cHc2yggy8Aw6ZSQ6F4WG9RVhAbDI5UGgMcaTaZzRbrFVEADCzE1YAYAAUwBaALLMLAACy2PAE5zElykaVyHiMZF4yh0BiFDylDQFdmMAJ0tljPgMovscoCUM6MNVcI2aqGAFdYBadt0sjrUHqFks00a1lnUbn81j0z1kPtZjgjllTm66R6Gd6bF4vLx-RpB8pRT4XnoI6Lo7GJUHE8pkx1glW4TiErXRnQJqWDuWyAqi+vIDb4lvdi3DsdkJ3UiIe1c+wgRbYyK93so+ezFC9zFYFEHf1ag+AMTA8Yxl1TVdj2VY9tnJSlqW1Xcpn3A0jyVSJG2zRCqQtK82xvO93UyJ9QB9LwE39QMZV0AwHnqAUtH+JwR30ZRmneLx-BTZBdngNJMIzL0HzI0TZEQDBjAFaT5UrWDIkoGhSM9bJnw5ZivzIepjD05QmiqPQ-D4hSsPWJhNm2bdVN7CjEFBeRWUeAxDD5QwPCnADBU8MhdDnZ53k+AwvCg4Sm3hRFkVrDEsSJEk8EEsS1MZV93zeULvw5P8I18-y52aD4vjCsyROwtdrLNLVbPIyS8iot8AyDDkg0Y+QI2MRRZ1jRQXA0X8Spg8ycMgGqJNyFRPjIBNnEgpcOXULyKi0apdL095OslSD5KGsqLP6Ws8wLHDavpWqJuZIdnBCzj1B5Jpcq6-LY0K4LQp2lY9o3c9rN2Mb1PshBlD+ab2S-V56gaRRFGYqodICsHuTAj6Trg2EELCJCLX+xlmhZNkWq5Hk+Vh1aEdlJGl143wgA */
  id: "new-connection",

  initial: "idle",

  invoke: {
    src: "cleanup",
    input: ({ context }) => context,
  },

  context: ({ input }) => input,

  states: {
    idle: {
      on: {
        "create-code": "creating code",
        "redeem-code": {
          target: "redeeming code",
          actions: {
            type: "setRedeemCodeToContext",
            params: ({ event }) => event.code,
          },
        },
      },
    },

    "creating code": {
      invoke: {
        src: "createCode",
        onDone: {
          target: "listening for redemptions",
          actions: {
            type: "setCreatedCodeToContext",
            params: ({ event }) => event.output,
          },
        },
      },
    },

    "listening for redemptions": {
      invoke: {
        src: "listenForRedemptions",
        input: ({ context }) => context,
      },

      on: {
        "redemption-received": {
          target: "connecting caller",
          actions: [
            {
              type: "saveRemoteUserIdToContext",
              params: ({ event }) => event.remoteUserId,
            },
            "createPeer",
          ],
        },
      },
    },

    "connecting caller": {
      invoke: {
        src: "connectCallerPeerMachine",
        id: "connectCallerPeerMachine",

        input: ({ context }) => ({
          currentUser: context.currentUser,
          peerConnection: new RTCPeerConnection(),
          remoteUserId: context.remoteUserId!,
          supabase: context.supabase,
        }),

        onDone: {
          target: "creating user connection",
          reenter: true,
        },
      },
    },

    connected: {
      type: "final",
    },

    "creating user connection": {
      invoke: {
        src: "createUserConnection",
        onDone: "connected",
        input: ({ context }) => context,
      },
    },

    "redeeming code": {
      invoke: {
        src: "redeemCode",
        input: ({ context }) => context,
        onDone: {
          target: "connecting receiver",
          actions: {
            type: "saveRemoteUserIdToContext",
            params: ({ event }) => event.output.remoteUserId,
          },
        },
      },
    },

    "connecting receiver": {
      invoke: {
        src: "connectReceiverPeerMachine",
        onDone: "connected",
        input: ({ context }) => ({
          currentUser: context.currentUser,
          peerConnection: new RTCPeerConnection(),
          remoteUserId: context.remoteUserId!,
          supabase: context.supabase,
        }),
      },
    },
  },
})
