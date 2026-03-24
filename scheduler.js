// ═══════════════════════════════════════
// Scheduling Engine
// ═══════════════════════════════════════
// 
function buildSchedule(productionJobs, workOrders, startDate) {
  const schedule = {};
  const allJobs = [...productionJobs].filter(j=>j.machineId && j.estimatedMinutes > 0);

  // Group by machine
  const byMachine = {};
  allJobs.forEach(j => {
    if(!byMachine[j.machineId]) byMachine[j.machineId] = [];
    byMachine[j.machineId].push(j);
  });

  // Compare two (date, minute) pairs: returns <0, 0, >0
  const cmpDT = (d1,m1,d2,m2) => d1===d2 ? m1-m2 : d1.localeCompare(d2);

  Object.entries(byMachine).forEach(([mid, jobs]) => {
    // Sort all jobs by assignedAt (preserves creation/assignment order)
    // Manual jobs with earlier planDate+planStartMin can jump ahead in time
    jobs.sort((a,b) => (a.assignedAt||0) - (b.assignedAt||0));

    // Cursor tracks where the next job can start on this machine
    let curDate = dateStr(startDate);
    let curMin = WORK_START;

    // Advance cursor past weekends & past work end
    const advanceCursor = () => {
      while(isWeekend(curDate)) { curDate = dateStr(nextWorkDay(curDate)); curMin = WORK_START; }
      if(curMin >= WORK_END) { curDate = dateStr(nextWorkDay(curDate)); curMin = WORK_START; }
      while(isWeekend(curDate)) { curDate = dateStr(nextWorkDay(curDate)); curMin = WORK_START; }
    };

    jobs.forEach(job => {
      advanceCursor();

      // If manual placement is LATER than cursor, jump forward (creates a gap/break)
      if(job.planDate && job.planStartMin != null) {
        if(cmpDT(job.planDate, job.planStartMin, curDate, curMin) > 0) {
          curDate = job.planDate;
          curMin = job.planStartMin;
          advanceCursor();
        }
      }

      // Place this job starting at cursor, spanning across days if needed
      let remaining = job.estimatedMinutes;
      const blocks = [];

      while(remaining > 0) {
        advanceCursor();
        const available = WORK_END - curMin;
        if(available <= 0) { curDate = dateStr(nextWorkDay(curDate)); curMin = WORK_START; continue; }
        const take = Math.min(remaining, available);
        const block = { date: curDate, start: curMin, end: curMin + take, jobId: job.id, machineId: mid };
        blocks.push(block);
        if(!schedule[curDate]) schedule[curDate] = [];
        schedule[curDate].push({ ...block, woId: job.woId, itemId: job.itemId });
        remaining -= take;
        curMin += take;
        if(remaining > 0) { curDate = dateStr(nextWorkDay(curDate)); curMin = WORK_START; }
      }

      job._blocks = blocks;
      if(blocks.length > 0) {
        const last = blocks[blocks.length-1];
        job._endDate = last.date;
        job._endTime = last.end;
      }
      // Cursor is now at end of this job → next job cascades from here
    });
  });

  return schedule;
}

// 
