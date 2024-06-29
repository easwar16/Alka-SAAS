import { auth, currentUser } from "@clerk/nextjs/server";
import { redirect } from "next/navigation";
import React from "react";
import { AgencyDetails } from "../../../../components/forms/agency-details";
import {
  getAuthUserDetails,
  verifyAndAcceptInvitation,
} from "../../../../lib/queries";
import { Plan } from "@prisma/client";

const page = async ({
  searchParams,
}: {
  searchParams: { plan: Plan; state: string; code: string };
}) => {
  const agencyID = await verifyAndAcceptInvitation();

  console.log(agencyID);

  const user = await getAuthUserDetails();
  if (agencyID)
    if (user?.role === "SUBACCOUNT_GUEST" || user?.role === "SUBACCOUNT_USER")
      return redirect("/subaccount");
    else if (user?.role === "AGENCY_ADMIN" || user?.role === "AGENCY_OWNER") {
      if (searchParams.plan) {
        return redirect(
          `/agency/${agencyID}/billing?plan=${searchParams.plan}`
        );
      }
      if (searchParams.state) {
        const statePath = searchParams.state.split("__")[0];
        const stateAgencyId = searchParams.state.split("__")[1];
        if (!stateAgencyId) return <div>Not authorized</div>;
        return redirect(
          `/agency/${stateAgencyId}/${statePath}?code=${searchParams.code}`
        );
      } else {
        return <div>Not Authorized</div>;
      }
    }

  const authUser = await currentUser();
  return (
    <div className="flex justify-center items-center mt-4">
      <div className="max-w-[850px] border-[1px] p-4 rounded-xl">
        <h1 className="text-4xl">Create an Agency</h1>
        <AgencyDetails
          data={{ companyEmail: authUser?.emailAddresses[0].emailAddress }}
        ></AgencyDetails>
      </div>
    </div>
  );
};

export default page;
