import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "../../components/common/Header";
import { SessionDetailsModal } from "../../components/ui/SessionDetailsModal";
import { DashboardSummary, DashboardSessions } from "./sections";
import { coachService } from "../../services/coach.service";
import {
  toSessionDetail,
  type ApiSession,
  type SessionDetailData,
} from "../../services/adapters";
import { sessionDetail as fallbackDetail } from "../../mock/data";

/**
 * Each section below loads its own data from a different API and shows its own
 * loader, so a fast endpoint paints immediately while a slow one keeps spinning
 * in place. There is no page-wide spinner.
 */
export const Dashboard: React.FC = () => {
  const navigate = useNavigate();
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [detail, setDetail] = useState<SessionDetailData>(fallbackDetail);

  const openDetails = async (raw: ApiSession) => {
    let note = null;
    let feedback = null;
    try {
      note = await coachService.getCoachNote(raw.id);
    } catch {
      /* not completed yet */
    }
    try {
      feedback = await coachService.getSessionFeedback(raw.id);
    } catch {
      /* no feedback yet */
    }
    setDetail(toSessionDetail(raw, { note, feedback }));
    setDetailsOpen(true);
  };

  return (
    <div className="flex flex-col gap-6">
      <Header title="Coach Dashboard" />

      <DashboardSummary />
      <DashboardSessions onOpenDetails={openDetails} />

      <SessionDetailsModal
        isOpen={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        detail={detail}
        onViewProfile={
          detail.clientId
            ? () => {
                setDetailsOpen(false);
                navigate(`/clients/${detail.clientId}`);
              }
            : undefined
        }
        onJoin={
          detail.meetingLink
            ? () => window.open(detail.meetingLink, "_blank")
            : undefined
        }
        onReschedule={() => {
          setDetailsOpen(false);
          navigate("/availability");
        }}
      />
    </div>
  );
};
