"use server";

import { clerkClient, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import { db } from "./db";
import { User } from "@prisma/client";
import { connect } from "http2";
import { use } from "react";

export const getAuthUserDetails = async () => {
  const user = await currentUser();
  if (!user) return;
  const userData = await db.user.findUnique({
    where: {
      email: user.emailAddresses[0].emailAddress,
    },
    include: {
      Agency: {
        include: {
          SidebarOption: true,
          SubAccount: {
            include: {
              SidebarOption: true,
            },
          },
        },
      },
      Permissions: true,
    },
  });
  return userData;
};

export const saveActivityLogs = async ({
  agencyId,
  description,
  subAccountId,
}: {
  agencyId?: string;
  description: string;
  subAccountId?: string;
}) => {
  const User = await currentUser();
  let userData;
  if (!User) {
    const response = await db.user.findFirst({
      where: {
        Agency: {
          SubAccount: {
            some: {
              id: subAccountId,
            },
          },
        },
      },
    });
    if (response) userData = response;
    else {
      userData = await db.user.findUnique({
        where: { email: User?.emailAddresses[0].emailAddresses },
      });
    }
    if (!userData) {
      console.log("User Not Found!");
      return;
    }
    let foundAgencyId = agencyId;
    if (!foundAgencyId) {
      if (!subAccountId) {
        throw new Error(
          "You need to provide atleast an agency Id or subAccount ID"
        );
      }
      const response = await db.subAccount.findUnique({
        where: {
          id: subAccountId,
        },
      });
      if (response) {
        foundAgencyId = response.agencyId;
      }
    }
    if (subAccountId) {
      await db.notification.create({
        data: {
          notification: `${userData.name}  | ${description}`,
          User: {
            connect: {
              id: userData.id,
            },
          },
          Agency: {
            connect: {
              id: foundAgencyId,
            },
          },
          SubAccount: {
            connect: {
              id: subAccountId,
            },
          },
        },
      });
    } else {
      await db.notification.create({
        data: {
          notification: `${userData.name}  | ${description}`,
          User: {
            connect: {
              id: userData.id,
            },
          },
          Agency: {
            connect: {
              id: foundAgencyId,
            },
          },
        },
      });
    }
  }
};

export const createTeamUser = async (agencyId: string, user: User) => {
  if (user.role === "AGENCY_OWNER") return null;
  const response = await db.user.create({ data: { ...user } });
  return response;
};

export const verifyAndAcceptInvitation = async () => {
  const user = await currentUser();
  if (!user) return redirect("/sign-in");
  const invitaitonExists = await db.invitation.findUnique({
    where: { email: user.emailAddresses[0].emailAddress, status: "PENDING" },
  });

  if (invitaitonExists) {
    const userDetails = await createTeamUser(invitaitonExists.agencyId, {
      id: user.id,
      email: invitaitonExists.email,
      agencyId: invitaitonExists.agencyId,
      avatarUrl: user.imageUrl,
      name: `${user.firstName}${user.lastName}`,
      role: invitaitonExists.role,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
    await saveActivityLogs({
      agencyId: invitaitonExists?.agencyId,
      description: "Joined",
      subAccountId: undefined,
    });
    if (userDetails) {
      await clerkClient.users.updateUserMetadata(user.id, {
        privateMetadata: { role: userDetails.role || "SUBACCOUNT_USER" },
      });

      await db.invitation.delete({
        where: {
          email: userDetails.email,
        },
      });
    } else {
      const agency = await db.user.findUnique({
        where: {
          email: user?.emailAddresses[0].emailAddress,
        },
      });
      return agency ? agency.agencyId : null;
    }
  }
};
