/**
 * THE ATTENDANCE RECORDS, transcribed from `data/employee_work_start_data.xlsx`.
 *
 * GENERATED — do not edit. Run `npm run build:attendance` to regenerate, and
 * see `scripts/build-attendance.ts` for why the workbook is transcribed into a
 * module rather than parsed at runtime. `verify:attendance` re-reads the
 * workbook and asserts this file still matches it row for row.
 *
 * 3219 rows across 49 dates, in the workbook's own order.
 * One line per record, pipe-separated:
 *
 *   date | day | employee id | employee name | department | check-in |
 *   actual work start | delay minutes | delay seconds
 *
 * Times are the sheet's own, written as a 24-hour clock — this workbook prints
 * them to the minute. The delay minutes are its own Delay Time column, which
 * was written from timestamps that still had seconds; the delay seconds are the
 * gap between the printed times, so the two can differ by up to a minute.
 * Nothing here is re-ordered, de-duplicated or filled in. The names are the
 * only joined column: this sheet has none, so they come from the earlier
 * workbook on employee id, and the day name is derived from the date.
 */

/** The workbook these records come from, named so the park can say so. */
export const ATTENDANCE_SOURCE = "employee_work_start_data.xlsx";

/** The sheet within it. */
export const ATTENDANCE_SHEET = "Employee Data";

/** How many records the workbook holds — asserted against the parse below. */
export const ATTENDANCE_ROW_COUNT = 3219;

export const ATTENDANCE_RECORDS = `2026-07-01|Wed|FS0292|Akash  B|dev|09:45:00|09:52:00|6|420
2026-07-01|Wed|FS0190|Anurag Virendrakumar|devops|09:43:00|09:58:00|15|900
2026-07-01|Wed|FS0426|Astin Ravi|cyber|09:48:00|10:18:00|30|1800
2026-07-01|Wed|FS0015|Baskaran J|risk|09:30:00|10:15:00|45|2700
2026-07-01|Wed|FS0194|Bharathi Arjunan|dev|10:01:00|10:16:00|15|900
2026-07-01|Wed|FS0377|Daniel Raj N|it support|09:52:00|09:56:00|4|240
2026-07-01|Wed|FS0195|David Mariyajebamalai|dev|09:45:00|10:24:00|38|2340
2026-07-01|Wed|FS0303|Deepeka|dev|09:38:00|09:53:00|15|900
2026-07-01|Wed|FS0277|Deepesh Raj B|dev|10:20:00|10:35:00|15|900
2026-07-01|Wed|FS0046|Divya Priya Senthilkumaran|pm|10:29:00|10:29:00|0|0
2026-07-01|Wed|FS0284|Elaisha  Mothi E|dev|09:43:00|09:50:00|6|420
2026-07-01|Wed|FS0320|Gayathri K|data|09:14:00|09:29:00|15|900
2026-07-01|Wed|FS0228|Geetha Karnan|risk|09:30:00|10:01:00|30|1860
2026-07-01|Wed|FS0319|Gokulakannan Duraisamy|ml|09:30:00|09:51:00|21|1260
2026-07-01|Wed|FS0073|Gokulakannan Selvam|design|07:51:00|07:59:00|7|480
2026-07-01|Wed|FS0161|Haridha Muruganantham|erp|09:54:00|09:54:00|0|0
2026-07-01|Wed|FS0343|Hariharan Vijayakumar|erp|09:25:00|09:25:00|0|0
2026-07-01|Wed|FS0164|Harishkanna Baladhandapan|risk|09:45:00|10:25:00|40|2400
2026-07-01|Wed|FS0232|Jagadeesan Jayaraj|risk|09:45:00|10:05:00|20|1200
2026-07-01|Wed|FS0036|Jai Surya S|design|09:04:00|09:10:00|6|360
2026-07-01|Wed|FS0433|keerthivaasen.v@finstein.ai|cyber|08:46:00|00:05:00|919|55140
2026-07-01|Wed|FS0158|Kishore Theiveekan|dev|09:21:00|09:36:00|15|900
2026-07-01|Wed|FS0126|Lakshmi Prasanna U|admin|09:45:00|09:45:00|0|0
2026-07-01|Wed|FS0437|Lenci Manuela L|it support|09:58:00|09:58:00|0|0
2026-07-01|Wed|FS0203|Logesh Palani|testing|09:30:00|09:42:00|12|720
2026-07-01|Wed|FS0339|Magesh Kumar|cyber|09:38:00|09:42:00|4|240
2026-07-01|Wed|FS0135|MAHESH T|cyber|09:45:00|10:30:00|45|2700
2026-07-01|Wed|FS0027|Manikadan P|design|10:41:00|10:46:00|5|300
2026-07-01|Wed|FS0298|Nantha Guru|dev|09:36:00|00:00:00|863|51840
2026-07-01|Wed|FS0390|Naveen Prasad Moorthy|dev|09:24:00|09:29:00|5|300
2026-07-01|Wed|FS0287|Nedunchezhiyan  M|dev|09:04:00|09:42:00|37|2280
2026-07-01|Wed|FS0321|Nithyanantham V|devops|09:30:00|09:45:00|15|900
2026-07-01|Wed|FS0306|PRAKASH K|dev|09:45:00|09:58:00|12|780
2026-07-01|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|11:27:00|11:57:00|30|1800
2026-07-01|Wed|FS0404|Prem Shankar S|erp|11:00:00|11:00:00|0|0
2026-07-01|Wed|FS0393|Raja Balaji A|erp|09:25:00|09:25:00|0|0
2026-07-01|Wed|FS0424|Rajesh Pannirselvame|cyber|09:48:00|10:18:00|30|1800
2026-07-01|Wed|FS0398|Ranganathan C|erp|09:38:00|09:42:00|4|240
2026-07-01|Wed|FS0400|Rexlin Felix S|erp|10:16:00|10:23:00|6|420
2026-07-01|Wed|FS0392|Sakthi Pichaikkaran|erp|09:24:00|09:24:00|0|0
2026-07-01|Wed|FS0079|Sakthivel Mageshwaran|cyber|09:45:00|10:11:00|26|1560
2026-07-01|Wed|FS0438|Sangeetha Balasubramanian|testing|09:52:00|09:56:00|4|240
2026-07-01|Wed|FS0212|Santhosh Neelakandamoorthy|dev|09:46:00|09:50:00|4|240
2026-07-01|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:46:00|09:54:00|7|480
2026-07-01|Wed|FS0231|Saritha Sekar|risk|09:36:00|09:36:00|0|0
2026-07-01|Wed|FS0148|Selvaprakash Balan|dev|09:34:00|09:49:00|15|900
2026-07-01|Wed|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|09:56:00|11|660
2026-07-01|Wed|FS0270|Shakthipriya Babu|finance|10:50:00|06:32:00|1182|70920
2026-07-01|Wed|FS0447|Shankar Praneeth G|cyber|09:36:00|09:42:00|5|360
2026-07-01|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:50:00|09:56:00|5|360
2026-07-01|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:23:00|09:23:00|0|0
2026-07-01|Wed|FS0391|Shashwath Pasupathi|erp|10:02:00|10:02:00|0|0
2026-07-01|Wed|FS0037|Sivashankaran P|dev|09:41:00|09:56:00|15|900
2026-07-01|Wed|FS0038|Sooriya Balaji Iyappan|dev|09:45:00|09:57:00|12|720
2026-07-01|Wed|FS0324|Sowmya Prabhu|testing|10:06:00|10:36:00|30|1800
2026-07-01|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:22:00|09:27:00|5|300
2026-07-01|Wed|FS0406|Sri Sai Teja Kolla|finance|08:52:00|09:22:00|30|1800
2026-07-01|Wed|FS0329|Sridhar Kumar S|erp|09:35:00|09:39:00|4|240
2026-07-01|Wed|FS0428|Sriganth Chennan|cyber|09:50:00|10:20:00|30|1800
2026-07-01|Wed|FS0318|Suresh Babu S|testing|09:41:00|10:11:00|30|1800
2026-07-01|Wed|FS0085|Suryapriya Saravanan|dev|09:30:00|10:02:00|32|1920
2026-07-01|Wed|FS0430|Syed Riyas Niyas|cyber|09:42:00|01:33:00|950|57060
2026-07-01|Wed|FS0333|Theeban Babu S|dev|09:16:00|09:23:00|7|420
2026-07-01|Wed|FS0040|Veeravel Devaraj|ml|09:27:00|09:42:00|15|900
2026-07-01|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:11:00|10:15:00|4|240
2026-07-01|Wed|FS0291|Vicky  Kumar|erp|09:35:00|09:39:00|4|240
2026-07-01|Wed|FS0302|Vignesh  Babu|cyber|08:55:00|09:25:00|30|1800
2026-07-01|Wed|FS0325|Vijay Prakash A|testing|10:00:00|10:30:00|30|1800
2026-07-01|Wed|FS0353|Vishal Jayaraman|cyber|10:00:00|10:30:00|30|1800
2026-07-01|Wed|FS0035|Vivek I|cyber|09:30:00|09:33:00|3|180
2026-07-01|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:25:00|09:25:00|0|0
2026-07-01|Wed|FS0407|Yuvaraj Santhanam|erp|09:42:00|09:46:00|4|240
2026-07-02|Thu|FS0439|Abinesh Nagarajan|devops|09:30:00|10:12:00|42|2520
2026-07-02|Thu|FS0414|Adam Gil Christ|it support|10:16:00|10:22:00|5|360
2026-07-02|Thu|FS0292|Akash  B|dev|09:30:00|09:49:00|18|1140
2026-07-02|Thu|FS0190|Anurag Virendrakumar|devops|09:40:00|09:55:00|15|900
2026-07-02|Thu|FS0021|ARJUN V|dev|10:10:00|10:25:00|15|900
2026-07-02|Thu|FS0335|Arun Kumar K|testing|09:45:00|10:17:00|32|1920
2026-07-02|Thu|FS0050|Avinash Pandian|cyber|08:17:00|08:47:00|30|1800
2026-07-02|Thu|FS0194|Bharathi Arjunan|dev|09:48:00|10:03:00|15|900
2026-07-02|Thu|FS0377|Daniel Raj N|it support|09:48:00|09:48:00|0|0
2026-07-02|Thu|FS0195|David Mariyajebamalai|dev|09:30:00|09:56:00|26|1560
2026-07-02|Thu|FS0303|Deepeka|dev|09:25:00|09:40:00|15|900
2026-07-02|Thu|FS0277|Deepesh Raj B|dev|10:23:00|10:38:00|15|900
2026-07-02|Thu|FS0281|Dhanalakshmi S|dev|09:45:00|09:56:00|11|660
2026-07-02|Thu|FC0002|Dileep Thammana|finance|09:30:00|09:54:00|23|1440
2026-07-02|Thu|FS0284|Elaisha  Mothi E|dev|09:40:00|09:46:00|5|360
2026-07-02|Thu|FS0311|Ganesh D|design|09:45:00|10:04:00|19|1140
2026-07-02|Thu|FS0320|Gayathri K|data|09:27:00|09:42:00|15|900
2026-07-02|Thu|FS0073|Gokulakannan Selvam|design|07:53:00|08:00:00|6|420
2026-07-02|Thu|FS0161|Haridha Muruganantham|erp|09:37:00|09:37:00|0|0
2026-07-02|Thu|FS0343|Hariharan Vijayakumar|erp|09:42:00|09:42:00|0|0
2026-07-02|Thu|FS0164|Harishkanna Baladhandapan|risk|07:05:00|07:05:00|0|0
2026-07-02|Thu|FS0036|Jai Surya S|design|10:09:00|10:14:00|5|300
2026-07-02|Thu|FS0150|Karthikesan RajaRaman|dev|10:07:00|09:39:00|1412|84720
2026-07-02|Thu|FS0200|Kavinkumar Ramasamy|dev|09:30:00|10:14:00|43|2640
2026-07-02|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|09:00:00|09:09:00|8|540
2026-07-02|Thu|FS0158|Kishore Theiveekan|dev|08:27:00|11:03:00|155|9360
2026-07-02|Thu|FS0126|Lakshmi Prasanna U|admin|10:29:00|10:29:00|0|0
2026-07-02|Thu|FS0437|Lenci Manuela L|it support|09:44:00|09:44:00|0|0
2026-07-02|Thu|FS0339|Magesh Kumar|cyber|09:40:00|09:45:00|4|300
2026-07-02|Thu|FS0135|MAHESH T|cyber|03:36:00|04:06:00|30|1800
2026-07-02|Thu|FS0027|Manikadan P|design|10:29:00|10:34:00|5|300
2026-07-02|Thu|FS0298|Nantha Guru|dev|09:29:00|00:08:00|878|52740
2026-07-02|Thu|FS0390|Naveen Prasad Moorthy|dev|09:07:00|09:12:00|5|300
2026-07-02|Thu|FS0371|Navin D|dev|09:30:00|09:51:00|21|1260
2026-07-02|Thu|FS0287|Nedunchezhiyan  M|dev|07:13:00|08:53:00|99|6000
2026-07-02|Thu|FS0154|Nethaji Srinivasan|dev|09:45:00|10:05:00|20|1200
2026-07-02|Thu|FS0321|Nithyanantham V|devops|08:22:00|08:37:00|15|900
2026-07-02|Thu|FS0306|PRAKASH K|dev|09:15:00|09:30:00|15|900
2026-07-02|Thu|FS0209|Pravinabdulkalam Mathikannan|dev|10:34:00|10:49:00|15|900
2026-07-02|Thu|FS0404|Prem Shankar S|erp|11:00:00|11:00:00|0|0
2026-07-02|Thu|FS0393|Raja Balaji A|erp|09:42:00|09:42:00|0|0
2026-07-02|Thu|FS0424|Rajesh Pannirselvame|cyber|08:47:00|09:17:00|30|1800
2026-07-02|Thu|FS0398|Ranganathan C|erp|09:23:00|09:28:00|4|300
2026-07-02|Thu|FS0400|Rexlin Felix S|erp|09:47:00|09:52:00|4|300
2026-07-02|Thu|FS0392|Sakthi Pichaikkaran|erp|09:28:00|09:28:00|0|0
2026-07-02|Thu|FS0079|Sakthivel Mageshwaran|cyber|09:25:00|09:55:00|30|1800
2026-07-02|Thu|FS0438|Sangeetha Balasubramanian|testing|09:27:00|09:32:00|4|300
2026-07-02|Thu|FS0409|Sanjay Boopathy M|finance|10:17:00|09:47:00|1410|84600
2026-07-02|Thu|FS0212|Santhosh Neelakandamoorthy|dev|09:52:00|09:56:00|3|240
2026-07-02|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:45:00|10:00:00|15|900
2026-07-02|Thu|FS0031|Saravana Pandian S|design|09:45:00|10:06:00|20|1260
2026-07-02|Thu|FS0106|Saravanan Devendhiran|dev|10:51:00|11:06:00|15|900
2026-07-02|Thu|FS0148|Selvaprakash Balan|dev|09:49:00|10:04:00|15|900
2026-07-02|Thu|FS0125|Shahul Hameed Abdul Samad|risk|02:07:00|02:07:00|0|0
2026-07-02|Thu|FS0270|Shakthipriya Babu|finance|09:45:00|10:02:00|16|1020
2026-07-02|Thu|FS0447|Shankar Praneeth G|cyber|09:27:00|09:32:00|4|300
2026-07-02|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:39:00|09:44:00|4|300
2026-07-02|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:11:00|09:11:00|0|0
2026-07-02|Thu|FS0391|Shashwath Pasupathi|erp|09:54:00|09:54:00|0|0
2026-07-02|Thu|FS0037|Sivashankaran P|dev|09:39:00|09:54:00|15|900
2026-07-02|Thu|FS0038|Sooriya Balaji Iyappan|dev|08:10:00|08:25:00|15|900
2026-07-02|Thu|FS0324|Sowmya Prabhu|testing|10:03:00|10:33:00|30|1800
2026-07-02|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:23:00|09:28:00|4|300
2026-07-02|Thu|FS0406|Sri Sai Teja Kolla|finance|08:44:00|09:14:00|30|1800
2026-07-02|Thu|FS0329|Sridhar Kumar S|erp|09:16:00|09:21:00|5|300
2026-07-02|Thu|FS0428|Sriganth Chennan|cyber|09:53:00|10:23:00|30|1800
2026-07-02|Thu|FS0318|Suresh Babu S|testing|09:44:00|10:14:00|30|1800
2026-07-02|Thu|FS0085|Suryapriya Saravanan|dev|11:29:00|11:44:00|15|900
2026-07-02|Thu|FS0430|Syed Riyas Niyas|cyber|09:46:00|00:27:00|880|52860
2026-07-02|Thu|FS0333|Theeban Babu S|dev|09:07:00|08:36:00|1409|84540
2026-07-02|Thu|FS0040|Veeravel Devaraj|ml|09:45:00|10:28:00|43|2580
2026-07-02|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:19:00|10:23:00|4|240
2026-07-02|Thu|FS0291|Vicky  Kumar|erp|09:09:00|09:14:00|4|300
2026-07-02|Thu|FS0302|Vignesh  Babu|cyber|08:49:00|09:19:00|30|1800
2026-07-02|Thu|FS0325|Vijay Prakash A|testing|10:05:00|10:35:00|30|1800
2026-07-02|Thu|FS0353|Vishal Jayaraman|cyber|10:23:00|10:53:00|30|1800
2026-07-02|Thu|FS0035|Vivek I|cyber|09:30:00|09:54:00|23|1440
2026-07-02|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:29:00|09:29:00|0|0
2026-07-02|Thu|FS0090|Yogeswaran Murugavel|cyber|09:45:00|10:08:00|23|1380
2026-07-02|Thu|FS0407|Yuvaraj Santhanam|erp|10:00:00|10:05:00|4|300
2026-07-03|Fri|FS0414|Adam Gil Christ|it support|10:05:00|10:10:00|4|300
2026-07-03|Fri|FS0292|Akash  B|dev|09:45:00|10:18:00|32|1980
2026-07-03|Fri|FS0190|Anurag Virendrakumar|devops|09:40:00|09:55:00|15|900
2026-07-03|Fri|FS0335|Arun Kumar K|testing|09:45:00|10:02:00|16|1020
2026-07-03|Fri|FS0426|Astin Ravi|cyber|08:48:00|09:18:00|30|1800
2026-07-03|Fri|FS0050|Avinash Pandian|cyber|08:37:00|09:07:00|30|1800
2026-07-03|Fri|FS0188|Bharadwaj Kalathur Vadyar|finance|10:51:00|11:21:00|30|1800
2026-07-03|Fri|FS0193|Bharath Selvam|data|09:45:00|10:24:00|39|2340
2026-07-03|Fri|FS0377|Daniel Raj N|it support|09:22:00|09:22:00|0|0
2026-07-03|Fri|FS0195|David Mariyajebamalai|dev|09:45:00|09:52:00|6|420
2026-07-03|Fri|FS0277|Deepesh Raj B|dev|09:45:00|10:31:00|45|2760
2026-07-03|Fri|FS0281|Dhanalakshmi S|dev|09:38:00|09:43:00|4|300
2026-07-03|Fri|FS0046|Divya Priya Senthilkumaran|pm|10:35:00|10:35:00|0|0
2026-07-03|Fri|FS0284|Elaisha  Mothi E|dev|09:38:00|09:46:00|7|480
2026-07-03|Fri|FS0320|Gayathri K|data|09:27:00|09:42:00|15|900
2026-07-03|Fri|FS0073|Gokulakannan Selvam|design|08:02:00|08:08:00|5|360
2026-07-03|Fri|FS0161|Haridha Muruganantham|erp|10:14:00|10:14:00|0|0
2026-07-03|Fri|FS0343|Hariharan Vijayakumar|erp|09:29:00|09:29:00|0|0
2026-07-03|Fri|FS0200|Kavinkumar Ramasamy|dev|09:30:00|10:13:00|43|2580
2026-07-03|Fri|FS0433|keerthivaasen.v@finstein.ai|cyber|08:58:00|09:17:00|18|1140
2026-07-03|Fri|FS0158|Kishore Theiveekan|dev|09:39:00|09:54:00|15|900
2026-07-03|Fri|FS0126|Lakshmi Prasanna U|admin|10:33:00|10:33:00|0|0
2026-07-03|Fri|FS0437|Lenci Manuela L|it support|09:32:00|09:32:00|0|0
2026-07-03|Fri|FS0339|Magesh Kumar|cyber|09:59:00|10:04:00|4|300
2026-07-03|Fri|FS0027|Manikadan P|design|10:20:00|10:26:00|5|360
2026-07-03|Fri|FS0297|Maruthan G|dev|09:45:00|10:28:00|42|2580
2026-07-03|Fri|FS0390|Naveen Prasad Moorthy|dev|08:09:00|08:14:00|4|300
2026-07-03|Fri|FS0287|Nedunchezhiyan  M|dev|06:51:00|09:58:00|187|11220
2026-07-03|Fri|FS0321|Nithyanantham V|devops|08:39:00|08:54:00|15|900
2026-07-03|Fri|FS0306|PRAKASH K|dev|09:45:00|09:55:00|10|600
2026-07-03|Fri|FS0209|Pravinabdulkalam Mathikannan|dev|10:04:00|22:25:00|740|44460
2026-07-03|Fri|FS0393|Raja Balaji A|erp|09:29:00|09:29:00|0|0
2026-07-03|Fri|FS0424|Rajesh Pannirselvame|cyber|08:48:00|09:18:00|30|1800
2026-07-03|Fri|FS0398|Ranganathan C|erp|09:25:00|09:30:00|5|300
2026-07-03|Fri|FS0400|Rexlin Felix S|erp|10:14:00|10:21:00|6|420
2026-07-03|Fri|FS0392|Sakthi Pichaikkaran|erp|09:23:00|09:23:00|0|0
2026-07-03|Fri|FS0079|Sakthivel Mageshwaran|cyber|10:18:00|10:48:00|30|1800
2026-07-03|Fri|FS0438|Sangeetha Balasubramanian|testing|09:17:00|09:21:00|4|240
2026-07-03|Fri|FS0409|Sanjay Boopathy M|finance|10:06:00|09:35:00|1409|84540
2026-07-03|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:32:00|09:36:00|4|240
2026-07-03|Fri|FS0442|Santhoshkumar Palanichamy|dev|10:04:00|10:19:00|15|900
2026-07-03|Fri|FS0031|Saravana Pandian S|design|10:38:00|10:38:00|0|0
2026-07-03|Fri|FS0106|Saravanan Devendhiran|dev|09:30:00|09:40:00|9|600
2026-07-03|Fri|FS0231|Saritha Sekar|risk|10:33:00|10:33:00|0|0
2026-07-03|Fri|FS0148|Selvaprakash Balan|dev|08:57:00|09:12:00|15|900
2026-07-03|Fri|FS0270|Shakthipriya Babu|finance|10:49:00|00:00:00|790|47460
2026-07-03|Fri|FS0447|Shankar Praneeth G|cyber|10:08:00|10:13:00|4|300
2026-07-03|Fri|FS0215|Shanmugam Mohanasundaram|dev|09:06:00|09:11:00|4|300
2026-07-03|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:40:00|09:40:00|0|0
2026-07-03|Fri|FS0391|Shashwath Pasupathi|erp|09:58:00|09:58:00|0|0
2026-07-03|Fri|FS0037|Sivashankaran P|dev|09:41:00|09:56:00|15|900
2026-07-03|Fri|FS0230|Sneka Sivaprakasam|finance|09:54:00|10:24:00|30|1800
2026-07-03|Fri|FS0324|Sowmya Prabhu|testing|10:08:00|10:38:00|30|1800
2026-07-03|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:24:00|09:29:00|5|300
2026-07-03|Fri|FS0406|Sri Sai Teja Kolla|finance|08:54:00|09:24:00|30|1800
2026-07-03|Fri|FS0329|Sridhar Kumar S|erp|09:23:00|09:28:00|4|300
2026-07-03|Fri|FS0428|Sriganth Chennan|cyber|09:27:00|09:57:00|30|1800
2026-07-03|Fri|FS0318|Suresh Babu S|testing|09:29:00|09:59:00|30|1800
2026-07-03|Fri|FS0085|Suryapriya Saravanan|dev|11:03:00|11:18:00|15|900
2026-07-03|Fri|FS0430|Syed Riyas Niyas|cyber|09:45:00|01:37:00|951|57120
2026-07-03|Fri|FS0333|Theeban Babu S|dev|08:09:00|08:14:00|5|300
2026-07-03|Fri|FS0040|Veeravel Devaraj|ml|09:39:00|09:54:00|15|900
2026-07-03|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:25:00|10:29:00|4|240
2026-07-03|Fri|FS0291|Vicky  Kumar|erp|09:29:00|09:35:00|5|360
2026-07-03|Fri|FS0302|Vignesh  Babu|cyber|08:02:00|08:32:00|30|1800
2026-07-03|Fri|FS0325|Vijay Prakash A|testing|10:12:00|10:42:00|30|1800
2026-07-03|Fri|FS0353|Vishal Jayaraman|cyber|10:34:00|11:04:00|30|1800
2026-07-03|Fri|FS0035|Vivek I|cyber|09:30:00|09:48:00|18|1080
2026-07-03|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:13:00|09:13:00|0|0
2026-07-03|Fri|FS0090|Yogeswaran Murugavel|cyber|10:21:00|10:51:00|30|1800
2026-07-03|Fri|FS0330|Yokesh U|testing|09:30:00|09:53:00|23|1380
2026-07-03|Fri|FS0407|Yuvaraj Santhanam|erp|09:54:00|09:58:00|4|240
2026-07-04|Sat|FS0439|Abinesh Nagarajan|devops|09:34:00|09:49:00|15|900
2026-07-04|Sat|FS0414|Adam Gil Christ|it support|09:54:00|09:59:00|5|300
2026-07-04|Sat|FS0152|Ajith Kumar Ramalingam|dev|09:30:00|09:31:00|0|60
2026-07-04|Sat|FS0292|Akash  B|dev|01:41:00|01:56:00|15|900
2026-07-04|Sat|FS0426|Astin Ravi|cyber|08:29:00|08:59:00|30|1800
2026-07-04|Sat|FS0050|Avinash Pandian|cyber|08:49:00|09:19:00|30|1800
2026-07-04|Sat|FS0049|Balaji|dev|10:22:00|10:37:00|15|900
2026-07-04|Sat|FS0193|Bharath Selvam|data|09:42:00|13:16:00|214|12840
2026-07-04|Sat|FS0194|Bharathi Arjunan|dev|10:04:00|10:19:00|15|900
2026-07-04|Sat|FS0195|David Mariyajebamalai|dev|09:40:00|09:55:00|15|900
2026-07-04|Sat|FS0340|Deepa K|testing|10:23:00|10:53:00|30|1800
2026-07-04|Sat|FS0303|Deepeka|dev|09:24:00|09:39:00|15|900
2026-07-04|Sat|FS0277|Deepesh Raj B|dev|10:37:00|10:52:00|15|900
2026-07-04|Sat|FS0281|Dhanalakshmi S|dev|09:30:00|09:57:00|26|1620
2026-07-04|Sat|FC0002|Dileep Thammana|finance|09:45:00|09:57:00|12|720
2026-07-04|Sat|FS0046|Divya Priya Senthilkumaran|pm|09:45:00|09:45:00|0|0
2026-07-04|Sat|FS0320|Gayathri K|data|09:36:00|09:51:00|15|900
2026-07-04|Sat|FS0319|Gokulakannan Duraisamy|ml|10:23:00|10:38:00|15|900
2026-07-04|Sat|FS0073|Gokulakannan Selvam|design|07:59:00|10:20:00|140|8460
2026-07-04|Sat|FS0343|Hariharan Vijayakumar|erp|09:14:00|09:14:00|0|0
2026-07-04|Sat|FS0164|Harishkanna Baladhandapan|risk|02:51:00|02:51:00|0|0
2026-07-04|Sat|FS0036|Jai Surya S|design|08:37:00|08:42:00|5|300
2026-07-04|Sat|FS0350|Janaki L|testing|10:23:00|10:53:00|30|1800
2026-07-04|Sat|FS0150|Karthikesan RajaRaman|dev|10:23:00|10:28:00|4|300
2026-07-04|Sat|FS0200|Kavinkumar Ramasamy|dev|09:36:00|09:51:00|15|900
2026-07-04|Sat|FS0433|keerthivaasen.v@finstein.ai|cyber|09:30:00|09:50:00|20|1200
2026-07-04|Sat|FS0323|Kishore M|devops|09:30:00|10:10:00|39|2400
2026-07-04|Sat|FS0158|Kishore Theiveekan|dev|08:41:00|08:56:00|14|900
2026-07-04|Sat|FS0437|Lenci Manuela L|it support|09:38:00|09:38:00|0|0
2026-07-04|Sat|FS0203|Logesh Palani|testing|10:27:00|10:57:00|30|1800
2026-07-04|Sat|FS0339|Magesh Kumar|cyber|09:32:00|10:02:00|29|1800
2026-07-04|Sat|FS0027|Manikadan P|design|09:30:00|09:48:00|18|1080
2026-07-04|Sat|FS0297|Maruthan G|dev|10:22:00|10:37:00|15|900
2026-07-04|Sat|FS0076|Meena Rajendran|testing|10:22:00|10:52:00|30|1800
2026-07-04|Sat|FS0063|Meenakshi Priya|finance|09:30:00|09:43:00|12|780
2026-07-04|Sat|FS0298|Nantha Guru|dev|10:21:00|00:00:00|818|49140
2026-07-04|Sat|FS0390|Naveen Prasad Moorthy|dev|08:11:00|08:16:00|5|300
2026-07-04|Sat|FS0371|Navin D|dev|10:22:00|10:37:00|15|900
2026-07-04|Sat|FS0154|Nethaji Srinivasan|dev|10:22:00|10:06:00|1424|85440
2026-07-04|Sat|FS0321|Nithyanantham V|devops|09:14:00|09:29:00|15|900
2026-07-04|Sat|FS0306|PRAKASH K|dev|09:40:00|09:55:00|15|900
2026-07-04|Sat|FS0322|Praveenkumar Saminathan|devops|09:27:00|09:42:00|15|900
2026-07-04|Sat|FS0404|Prem Shankar S|erp|09:47:00|09:47:00|0|0
2026-07-04|Sat|FS0393|Raja Balaji A|erp|08:41:00|08:41:00|0|0
2026-07-04|Sat|FS0424|Rajesh Pannirselvame|cyber|08:29:00|08:59:00|30|1800
2026-07-04|Sat|FS0142|Rajesh Rajendran|dev|10:22:00|09:56:00|1413|84840
2026-07-04|Sat|FS0398|Ranganathan C|erp|09:20:00|11:53:00|153|9180
2026-07-04|Sat|FS0400|Rexlin Felix S|erp|09:42:00|09:48:00|5|360
2026-07-04|Sat|FS0392|Sakthi Pichaikkaran|erp|09:18:00|09:18:00|0|0
2026-07-04|Sat|FS0079|Sakthivel Mageshwaran|cyber|09:39:00|10:09:00|30|1800
2026-07-04|Sat|FS0409|Sanjay Boopathy M|finance|09:53:00|08:48:00|1374|82500
2026-07-04|Sat|FS0212|Santhosh Neelakandamoorthy|dev|09:21:00|10:04:00|42|2580
2026-07-04|Sat|FS0442|Santhoshkumar Palanichamy|dev|09:39:00|09:54:00|15|900
2026-07-04|Sat|FS0334|Sarathi S S|testing|10:23:00|10:53:00|30|1800
2026-07-04|Sat|FS0106|Saravanan Devendhiran|dev|10:24:00|10:39:00|15|900
2026-07-04|Sat|FS0148|Selvaprakash Balan|dev|09:22:00|09:37:00|15|900
2026-07-04|Sat|FS0270|Shakthipriya Babu|finance|10:42:00|00:03:00|801|48060
2026-07-04|Sat|FS0080|Shamili Anbuselvan|dev|10:22:00|10:37:00|15|900
2026-07-04|Sat|FS0215|Shanmugam Mohanasundaram|dev|09:07:00|10:04:00|56|3420
2026-07-04|Sat|FS0022|Shashti Priyan shathiyavelu|design|08:43:00|08:43:00|0|0
2026-07-04|Sat|FS0391|Shashwath Pasupathi|erp|10:07:00|10:07:00|0|0
2026-07-04|Sat|FS0324|Sowmya Prabhu|testing|09:42:00|10:12:00|30|1800
2026-07-04|Sat|FS0423|Sri Cibi Sivakumar|cyber|09:14:00|10:01:00|47|2820
2026-07-04|Sat|FS0329|Sridhar Kumar S|erp|09:39:00|10:01:00|21|1320
2026-07-04|Sat|FS0428|Sriganth Chennan|cyber|09:51:00|10:21:00|30|1800
2026-07-04|Sat|FS0082|Stalin Innacimuthu|dev|10:22:00|10:37:00|15|900
2026-07-04|Sat|FS0318|Suresh Babu S|testing|09:32:00|10:02:00|30|1800
2026-07-04|Sat|FS0430|Syed Riyas Niyas|cyber|09:34:00|09:39:00|5|300
2026-07-04|Sat|FS0333|Theeban Babu S|dev|08:11:00|08:16:00|5|300
2026-07-04|Sat|FS0040|Veeravel Devaraj|ml|00:57:00|01:12:00|15|900
2026-07-04|Sat|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:50:00|09:55:00|4|300
2026-07-04|Sat|FS0291|Vicky  Kumar|erp|09:24:00|09:57:00|33|1980
2026-07-04|Sat|FS0325|Vijay Prakash A|testing|09:22:00|09:52:00|30|1800
2026-07-04|Sat|FS0239|VIJAY S R|testing|09:45:00|10:17:00|32|1920
2026-07-04|Sat|FS0353|Vishal Jayaraman|cyber|09:39:00|10:09:00|30|1800
2026-07-04|Sat|FS0341|Vishnu Priya|testing|10:23:00|10:53:00|30|1800
2026-07-04|Sat|FS0219|Visvesvaran Kumaran|dev|09:45:00|10:29:00|43|2640
2026-07-04|Sat|FS0408|Yogeshwaran Govindaraj|erp|08:46:00|08:46:00|0|0
2026-07-04|Sat|FS0090|Yogeswaran Murugavel|cyber|09:39:00|10:09:00|30|1800
2026-07-06|Mon|FS0414|Adam Gil Christ|it support|09:51:00|09:57:00|6|360
2026-07-06|Mon|FS0292|Akash  B|dev|09:33:00|09:48:00|15|900
2026-07-06|Mon|FS0190|Anurag Virendrakumar|devops|09:33:00|09:48:00|15|900
2026-07-06|Mon|FS0426|Astin Ravi|cyber|09:08:00|09:38:00|30|1800
2026-07-06|Mon|FS0050|Avinash Pandian|cyber|11:01:00|11:31:00|30|1800
2026-07-06|Mon|FS0015|Baskaran J|risk|09:45:00|10:19:00|33|2040
2026-07-06|Mon|FS0194|Bharathi Arjunan|dev|09:59:00|10:14:00|15|900
2026-07-06|Mon|FS0377|Daniel Raj N|it support|10:22:00|10:22:00|0|0
2026-07-06|Mon|FS0195|David Mariyajebamalai|dev|11:25:00|11:40:00|15|900
2026-07-06|Mon|FS0303|Deepeka|dev|09:26:00|09:41:00|15|900
2026-07-06|Mon|FS0277|Deepesh Raj B|dev|10:18:00|10:33:00|15|900
2026-07-06|Mon|FS0243|DELLIBABU T|finance|09:36:00|10:06:00|30|1800
2026-07-06|Mon|FS0281|Dhanalakshmi S|dev|09:33:00|10:05:00|32|1920
2026-07-06|Mon|FC0002|Dileep Thammana|finance|09:30:00|09:57:00|26|1620
2026-07-06|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:04:00|10:04:00|0|0
2026-07-06|Mon|FS0320|Gayathri K|data|09:26:00|09:41:00|15|900
2026-07-06|Mon|FS0073|Gokulakannan Selvam|design|07:48:00|07:57:00|8|540
2026-07-06|Mon|FS0161|Haridha Muruganantham|erp|10:12:00|10:12:00|0|0
2026-07-06|Mon|FS0343|Hariharan Vijayakumar|erp|09:21:00|09:21:00|0|0
2026-07-06|Mon|FS0164|Harishkanna Baladhandapan|risk|09:45:00|09:48:00|2|180
2026-07-06|Mon|FS0036|Jai Surya S|design|09:40:00|09:49:00|8|540
2026-07-06|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|09:11:00|09:19:00|7|480
2026-07-06|Mon|FS0158|Kishore Theiveekan|dev|09:25:00|09:39:00|14|840
2026-07-06|Mon|FS0126|Lakshmi Prasanna U|admin|10:32:00|10:32:00|0|0
2026-07-06|Mon|FS0203|Logesh Palani|testing|09:45:00|10:31:00|45|2760
2026-07-06|Mon|FST0022|Madhumitha Chandrasekaran|finance|09:33:00|10:03:00|30|1800
2026-07-06|Mon|FS0339|Magesh Kumar|cyber|09:31:00|09:43:00|12|720
2026-07-06|Mon|FS0135|MAHESH T|cyber|09:30:00|09:53:00|22|1380
2026-07-06|Mon|FS0027|Manikadan P|design|09:45:00|10:10:00|25|1500
2026-07-06|Mon|FS0390|Naveen Prasad Moorthy|dev|09:19:00|14:21:00|301|18120
2026-07-06|Mon|FS0287|Nedunchezhiyan  M|dev|08:10:00|08:17:00|7|420
2026-07-06|Mon|FS0154|Nethaji Srinivasan|dev|09:30:00|10:05:00|34|2100
2026-07-06|Mon|FS0321|Nithyanantham V|devops|09:11:00|09:26:00|15|900
2026-07-06|Mon|FS0306|PRAKASH K|dev|11:04:00|11:19:00|15|900
2026-07-06|Mon|FS0209|Pravinabdulkalam Mathikannan|dev|09:45:00|09:57:00|12|720
2026-07-06|Mon|FS0404|Prem Shankar S|erp|09:31:00|09:31:00|0|0
2026-07-06|Mon|FS0424|Rajesh Pannirselvame|cyber|10:09:00|10:39:00|30|1800
2026-07-06|Mon|FS0398|Ranganathan C|erp|09:23:00|09:29:00|5|360
2026-07-06|Mon|FS0400|Rexlin Felix S|erp|09:43:00|09:52:00|9|540
2026-07-06|Mon|FS0392|Sakthi Pichaikkaran|erp|09:26:00|09:26:00|0|0
2026-07-06|Mon|FS0079|Sakthivel Mageshwaran|cyber|09:51:00|10:21:00|30|1800
2026-07-06|Mon|FS0438|Sangeetha Balasubramanian|testing|09:31:00|09:43:00|12|720
2026-07-06|Mon|FS0409|Sanjay Boopathy M|finance|09:51:00|08:53:00|1381|82920
2026-07-06|Mon|FS0212|Santhosh Neelakandamoorthy|dev|09:34:00|09:38:00|4|240
2026-07-06|Mon|FS0442|Santhoshkumar Palanichamy|dev|09:45:00|10:00:00|15|900
2026-07-06|Mon|FS0031|Saravana Pandian S|design|10:10:00|10:10:00|0|0
2026-07-06|Mon|FS0106|Saravanan Devendhiran|dev|09:33:00|09:48:00|15|900
2026-07-06|Mon|FS0231|Saritha Sekar|risk|09:35:00|09:35:00|0|0
2026-07-06|Mon|FS0148|Selvaprakash Balan|dev|09:26:00|09:41:00|15|900
2026-07-06|Mon|FS0125|Shahul Hameed Abdul Samad|risk|09:30:00|10:05:00|34|2100
2026-07-06|Mon|FS0270|Shakthipriya Babu|finance|10:37:00|10:43:00|5|360
2026-07-06|Mon|FS0447|Shankar Praneeth G|cyber|10:12:00|10:17:00|5|300
2026-07-06|Mon|FS0215|Shanmugam Mohanasundaram|dev|09:49:00|09:53:00|4|240
2026-07-06|Mon|FS0391|Shashwath Pasupathi|erp|10:02:00|10:02:00|0|0
2026-07-06|Mon|FS0037|Sivashankaran P|dev|09:31:00|09:46:00|15|900
2026-07-06|Mon|FS0038|Sooriya Balaji Iyappan|dev|08:41:00|08:56:00|15|900
2026-07-06|Mon|FS0324|Sowmya Prabhu|testing|09:56:00|10:26:00|30|1800
2026-07-06|Mon|FS0423|Sri Cibi Sivakumar|cyber|09:23:00|09:33:00|9|600
2026-07-06|Mon|FS0329|Sridhar Kumar S|erp|09:16:00|09:21:00|4|300
2026-07-06|Mon|FS0428|Sriganth Chennan|cyber|09:52:00|10:22:00|30|1800
2026-07-06|Mon|FS0430|Syed Riyas Niyas|cyber|10:09:00|10:13:00|4|240
2026-07-06|Mon|FS0333|Theeban Babu S|dev|09:19:00|09:24:00|4|300
2026-07-06|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:24:00|10:28:00|4|240
2026-07-06|Mon|FS0291|Vicky  Kumar|erp|09:35:00|09:59:00|23|1440
2026-07-06|Mon|FS0302|Vignesh  Babu|cyber|08:54:00|09:24:00|30|1800
2026-07-06|Mon|FS0325|Vijay Prakash A|testing|10:06:00|10:36:00|30|1800
2026-07-06|Mon|FS0239|VIJAY S R|testing|09:45:00|10:16:00|31|1860
2026-07-06|Mon|FS0353|Vishal Jayaraman|cyber|10:09:00|10:39:00|30|1800
2026-07-06|Mon|FS0035|Vivek I|cyber|09:30:00|09:44:00|13|840
2026-07-06|Mon|FS0294|Yamuna  M|dev|09:45:00|09:53:00|7|480
2026-07-06|Mon|FS0089|Yogeshwaran Chandrakasan|dev|09:30:00|09:56:00|25|1560
2026-07-06|Mon|FS0408|Yogeshwaran Govindaraj|erp|09:13:00|09:13:00|0|0
2026-07-06|Mon|FS0090|Yogeswaran Murugavel|cyber|09:03:00|09:33:00|30|1800
2026-07-06|Mon|FS0407|Yuvaraj Santhanam|erp|10:14:00|00:15:00|841|50460
2026-07-07|Tue|FS0414|Adam Gil Christ|it support|10:07:00|15:07:00|299|18000
2026-07-07|Tue|FS0152|Ajith Kumar Ramalingam|dev|09:45:00|10:02:00|16|1020
2026-07-07|Tue|FS0292|Akash  B|dev|09:30:00|10:13:00|43|2580
2026-07-07|Tue|FS0190|Anurag Virendrakumar|devops|10:34:00|10:49:00|15|900
2026-07-07|Tue|FS0342|Ashraf A|testing|11:20:00|11:33:00|13|780
2026-07-07|Tue|FS0018|Asmath Nisha|finance|09:54:00|11:33:00|98|5940
2026-07-07|Tue|FS0426|Astin Ravi|cyber|09:02:00|09:32:00|30|1800
2026-07-07|Tue|FS0050|Avinash Pandian|cyber|00:14:00|00:44:00|30|1800
2026-07-07|Tue|FS0015|Baskaran J|risk|03:08:00|03:08:00|0|0
2026-07-07|Tue|FS0193|Bharath Selvam|data|10:31:00|13:40:00|188|11340
2026-07-07|Tue|FS0194|Bharathi Arjunan|dev|10:05:00|10:20:00|15|900
2026-07-07|Tue|FS0377|Daniel Raj N|it support|10:08:00|20:51:00|643|38580
2026-07-07|Tue|FS0195|David Mariyajebamalai|dev|00:41:00|13:54:00|792|47580
2026-07-07|Tue|FS0303|Deepeka|dev|09:29:00|09:44:00|15|900
2026-07-07|Tue|FS0277|Deepesh Raj B|dev|09:30:00|10:10:00|40|2400
2026-07-07|Tue|FS0243|DELLIBABU T|finance|09:32:00|10:02:00|30|1800
2026-07-07|Tue|FS0281|Dhanalakshmi S|dev|09:35:00|09:42:00|6|420
2026-07-07|Tue|FS0101|Dhiwan Mariappan|finance|07:39:00|08:09:00|30|1800
2026-07-07|Tue|FC0002|Dileep Thammana|finance|09:45:00|10:04:00|18|1140
2026-07-07|Tue|FS0320|Gayathri K|data|09:17:00|09:32:00|15|900
2026-07-07|Tue|FS0319|Gokulakannan Duraisamy|ml|11:23:00|11:38:00|15|900
2026-07-07|Tue|FS0073|Gokulakannan Selvam|design|07:47:00|07:56:00|9|540
2026-07-07|Tue|FS0161|Haridha Muruganantham|erp|09:50:00|09:50:00|0|0
2026-07-07|Tue|FS0343|Hariharan Vijayakumar|erp|09:21:00|09:21:00|0|0
2026-07-07|Tue|FS0036|Jai Surya S|design|09:59:00|10:23:00|23|1440
2026-07-07|Tue|FST0013|Kalashree A|finance|09:45:00|10:09:00|24|1440
2026-07-07|Tue|FS0150|Karthikesan RajaRaman|dev|09:30:00|10:12:00|41|2520
2026-07-07|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:14:00|09:23:00|8|540
2026-07-07|Tue|FS0323|Kishore M|devops|09:30:00|09:59:00|29|1740
2026-07-07|Tue|FS0158|Kishore Theiveekan|dev|09:21:00|09:38:00|16|1020
2026-07-07|Tue|FS0126|Lakshmi Prasanna U|admin|11:15:00|11:15:00|0|0
2026-07-07|Tue|FS0437|Lenci Manuela L|it support|09:36:00|09:36:00|0|0
2026-07-07|Tue|FST0022|Madhumitha Chandrasekaran|finance|09:02:00|09:32:00|30|1800
2026-07-07|Tue|FS0339|Magesh Kumar|cyber|09:35:00|09:53:00|17|1080
2026-07-07|Tue|FS0135|MAHESH T|cyber|00:47:00|01:17:00|30|1800
2026-07-07|Tue|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|10:11:00|40|2460
2026-07-07|Tue|FS0390|Naveen Prasad Moorthy|dev|08:56:00|09:01:00|5|300
2026-07-07|Tue|FS0287|Nedunchezhiyan  M|dev|07:45:00|09:11:00|86|5160
2026-07-07|Tue|FS0321|Nithyanantham V|devops|09:21:00|09:36:00|15|900
2026-07-07|Tue|FS0306|PRAKASH K|dev|09:05:00|09:20:00|15|900
2026-07-07|Tue|FS0322|Praveenkumar Saminathan|devops|09:30:00|09:36:00|6|360
2026-07-07|Tue|FS0404|Prem Shankar S|erp|10:10:00|10:10:00|0|0
2026-07-07|Tue|FS0393|Raja Balaji A|erp|09:21:00|09:21:00|0|0
2026-07-07|Tue|FS0424|Rajesh Pannirselvame|cyber|09:02:00|09:32:00|30|1800
2026-07-07|Tue|FS0398|Ranganathan C|erp|09:05:00|09:10:00|4|300
2026-07-07|Tue|FS0079|Sakthivel Mageshwaran|cyber|09:35:00|10:05:00|30|1800
2026-07-07|Tue|FS0438|Sangeetha Balasubramanian|testing|09:37:00|11:32:00|114|6900
2026-07-07|Tue|FS0409|Sanjay Boopathy M|finance|10:08:00|09:28:00|1400|84000
2026-07-07|Tue|FS0212|Santhosh Neelakandamoorthy|dev|10:27:00|14:51:00|263|15840
2026-07-07|Tue|FS0442|Santhoshkumar Palanichamy|dev|08:58:00|09:13:00|15|900
2026-07-07|Tue|FS0031|Saravana Pandian S|design|10:31:00|10:31:00|0|0
2026-07-07|Tue|FS0231|Saritha Sekar|risk|10:22:00|10:22:00|0|0
2026-07-07|Tue|FS0148|Selvaprakash Balan|dev|09:29:00|09:44:00|15|900
2026-07-07|Tue|FS0125|Shahul Hameed Abdul Samad|risk|02:45:00|02:45:00|0|0
2026-07-07|Tue|FS0270|Shakthipriya Babu|finance|10:46:00|00:14:00|807|48480
2026-07-07|Tue|FS0447|Shankar Praneeth G|cyber|09:45:00|09:48:00|3|180
2026-07-07|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:29:00|12:20:00|171|10260
2026-07-07|Tue|FS0391|Shashwath Pasupathi|erp|10:10:00|10:10:00|0|0
2026-07-07|Tue|FS0037|Sivashankaran P|dev|09:47:00|10:02:00|15|900
2026-07-07|Tue|FS0038|Sooriya Balaji Iyappan|dev|08:16:00|08:31:00|15|900
2026-07-07|Tue|FS0324|Sowmya Prabhu|testing|10:00:00|10:30:00|30|1800
2026-07-07|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:22:00|09:42:00|20|1200
2026-07-07|Tue|FS0329|Sridhar Kumar S|erp|08:57:00|09:02:00|5|300
2026-07-07|Tue|FS0428|Sriganth Chennan|cyber|10:03:00|10:33:00|30|1800
2026-07-07|Tue|FS0085|Suryapriya Saravanan|dev|11:10:00|11:25:00|15|900
2026-07-07|Tue|FS0430|Syed Riyas Niyas|cyber|00:43:00|00:01:00|1398|83880
2026-07-07|Tue|FS0333|Theeban Babu S|dev|08:56:00|09:01:00|5|300
2026-07-07|Tue|FS0040|Veeravel Devaraj|ml|00:00:00|00:15:00|15|900
2026-07-07|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:13:00|10:43:00|30|1800
2026-07-07|Tue|FS0291|Vicky  Kumar|erp|09:50:00|09:50:00|0|0
2026-07-07|Tue|FS0302|Vignesh  Babu|cyber|08:44:00|09:14:00|30|1800
2026-07-07|Tue|FS0325|Vijay Prakash A|testing|10:06:00|10:36:00|30|1800
2026-07-07|Tue|FS0035|Vivek I|cyber|00:43:00|01:13:00|30|1800
2026-07-07|Tue|FS0294|Yamuna  M|dev|09:30:00|09:50:00|20|1200
2026-07-07|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:07:00|09:07:00|0|0
2026-07-07|Tue|FS0090|Yogeswaran Murugavel|cyber|10:18:00|10:48:00|30|1800
2026-07-07|Tue|FS0407|Yuvaraj Santhanam|erp|09:51:00|13:24:00|213|12780
2026-07-08|Wed|FS0414|Adam Gil Christ|it support|10:18:00|00:01:00|823|49380
2026-07-08|Wed|FS0190|Anurag Virendrakumar|devops|09:37:00|09:52:00|15|900
2026-07-08|Wed|FS0426|Astin Ravi|cyber|09:15:00|09:45:00|30|1800
2026-07-08|Wed|FS0193|Bharath Selvam|data|10:13:00|11:14:00|61|3660
2026-07-08|Wed|FS0194|Bharathi Arjunan|dev|09:59:00|10:14:00|15|900
2026-07-08|Wed|FS0377|Daniel Raj N|it support|09:58:00|10:03:00|4|300
2026-07-08|Wed|FS0195|David Mariyajebamalai|dev|09:45:00|09:56:00|11|660
2026-07-08|Wed|FS0303|Deepeka|dev|09:26:00|09:41:00|15|900
2026-07-08|Wed|FS0277|Deepesh Raj B|dev|09:39:00|09:54:00|15|900
2026-07-08|Wed|FS0243|DELLIBABU T|finance|09:27:00|09:57:00|30|1800
2026-07-08|Wed|FS0281|Dhanalakshmi S|dev|09:56:00|10:02:00|6|360
2026-07-08|Wed|FS0101|Dhiwan Mariappan|finance|08:07:00|08:37:00|30|1800
2026-07-08|Wed|FC0002|Dileep Thammana|finance|09:30:00|10:00:00|30|1800
2026-07-08|Wed|FS0046|Divya Priya Senthilkumaran|pm|10:29:00|10:29:00|0|0
2026-07-08|Wed|FS0284|Elaisha  Mothi E|dev|09:56:00|10:01:00|5|300
2026-07-08|Wed|FS0311|Ganesh D|design|09:45:00|09:48:00|3|180
2026-07-08|Wed|FS0320|Gayathri K|data|09:29:00|09:44:00|15|900
2026-07-08|Wed|FS0073|Gokulakannan Selvam|design|07:45:00|07:52:00|6|420
2026-07-08|Wed|FS0343|Hariharan Vijayakumar|erp|09:18:00|09:18:00|0|0
2026-07-08|Wed|FS0164|Harishkanna Baladhandapan|risk|09:30:00|10:04:00|33|2040
2026-07-08|Wed|FS0036|Jai Surya S|design|09:28:00|09:45:00|17|1020
2026-07-08|Wed|FST0013|Kalashree A|finance|09:30:00|09:37:00|6|420
2026-07-08|Wed|FS0433|keerthivaasen.v@finstein.ai|cyber|09:10:00|09:18:00|7|480
2026-07-08|Wed|FS0158|Kishore Theiveekan|dev|09:54:00|10:09:00|14|900
2026-07-08|Wed|FS0126|Lakshmi Prasanna U|admin|10:50:00|10:50:00|0|0
2026-07-08|Wed|FS0437|Lenci Manuela L|it support|10:09:00|10:09:00|0|0
2026-07-08|Wed|FST0022|Madhumitha Chandrasekaran|finance|10:25:00|10:55:00|30|1800
2026-07-08|Wed|FS0339|Magesh Kumar|cyber|09:32:00|09:37:00|5|300
2026-07-08|Wed|FS0135|MAHESH T|cyber|09:45:00|10:01:00|16|960
2026-07-08|Wed|FS0027|Manikadan P|design|09:45:00|10:15:00|30|1800
2026-07-08|Wed|FS0298|Nantha Guru|dev|10:44:00|00:02:00|798|47880
2026-07-08|Wed|FS0390|Naveen Prasad Moorthy|dev|09:07:00|09:12:00|5|300
2026-07-08|Wed|FS0154|Nethaji Srinivasan|dev|09:30:00|09:48:00|18|1080
2026-07-08|Wed|FST0011|Preethi Bernadath|finance|09:30:00|10:01:00|31|1860
2026-07-08|Wed|FS0393|Raja Balaji A|erp|08:44:00|08:44:00|0|0
2026-07-08|Wed|FS0424|Rajesh Pannirselvame|cyber|09:15:00|09:45:00|30|1800
2026-07-08|Wed|FS0142|Rajesh Rajendran|dev|09:45:00|09:46:00|0|60
2026-07-08|Wed|FS0398|Ranganathan C|erp|09:31:00|09:36:00|5|300
2026-07-08|Wed|FS0400|Rexlin Felix S|erp|09:54:00|09:59:00|5|300
2026-07-08|Wed|FS0392|Sakthi Pichaikkaran|erp|09:21:00|09:21:00|0|0
2026-07-08|Wed|FS0079|Sakthivel Mageshwaran|cyber|09:32:00|10:02:00|30|1800
2026-07-08|Wed|FS0438|Sangeetha Balasubramanian|testing|09:41:00|09:46:00|4|300
2026-07-08|Wed|FS0409|Sanjay Boopathy M|finance|10:18:00|08:51:00|1352|81180
2026-07-08|Wed|FS0212|Santhosh Neelakandamoorthy|dev|10:08:00|13:48:00|220|13200
2026-07-08|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:28:00|09:43:00|15|900
2026-07-08|Wed|FS0031|Saravana Pandian S|design|10:32:00|10:32:00|0|0
2026-07-08|Wed|FS0106|Saravanan Devendhiran|dev|09:18:00|09:33:00|15|900
2026-07-08|Wed|FS0130|Sathish Kumar Stalin|finance|09:30:00|10:04:00|34|2040
2026-07-08|Wed|FS0148|Selvaprakash Balan|dev|09:32:00|09:47:00|15|900
2026-07-08|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:35:00|09:39:00|4|240
2026-07-08|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:19:00|09:19:00|0|0
2026-07-08|Wed|FS0391|Shashwath Pasupathi|erp|10:03:00|10:03:00|0|0
2026-07-08|Wed|FS0037|Sivashankaran P|dev|09:31:00|09:46:00|15|900
2026-07-08|Wed|FS0324|Sowmya Prabhu|testing|10:06:00|10:36:00|30|1800
2026-07-08|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:23:00|09:28:00|5|300
2026-07-08|Wed|FS0329|Sridhar Kumar S|erp|09:14:00|09:20:00|5|360
2026-07-08|Wed|FS0428|Sriganth Chennan|cyber|10:04:00|10:34:00|30|1800
2026-07-08|Wed|FS0082|Stalin Innacimuthu|dev|09:30:00|09:37:00|6|420
2026-07-08|Wed|FS0318|Suresh Babu S|testing|09:28:00|09:58:00|30|1800
2026-07-08|Wed|FS0085|Suryapriya Saravanan|dev|09:30:00|09:36:00|5|360
2026-07-08|Wed|FS0430|Syed Riyas Niyas|cyber|09:55:00|10:38:00|43|2580
2026-07-08|Wed|FS0333|Theeban Babu S|dev|09:07:00|09:12:00|5|300
2026-07-08|Wed|FS0040|Veeravel Devaraj|ml|00:10:00|00:25:00|15|900
2026-07-08|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:04:00|10:34:00|30|1800
2026-07-08|Wed|FS0291|Vicky  Kumar|erp|09:44:00|09:49:00|5|300
2026-07-08|Wed|FS0302|Vignesh  Babu|cyber|08:58:00|09:28:00|30|1800
2026-07-08|Wed|FS0325|Vijay Prakash A|testing|10:04:00|10:34:00|30|1800
2026-07-08|Wed|FS0035|Vivek I|cyber|09:45:00|09:49:00|3|240
2026-07-08|Wed|FS0294|Yamuna  M|dev|09:45:00|10:18:00|33|1980
2026-07-08|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:12:00|09:12:00|0|0
2026-07-08|Wed|FS0090|Yogeswaran Murugavel|cyber|11:05:00|11:35:00|30|1800
2026-07-08|Wed|FS0407|Yuvaraj Santhanam|erp|09:47:00|09:51:00|4|240
2026-07-09|Thu|FS0414|Adam Gil Christ|it support|10:25:00|12:23:00|118|7080
2026-07-09|Thu|FS0190|Anurag Virendrakumar|devops|09:38:00|09:53:00|15|900
2026-07-09|Thu|FS0342|Ashraf A|testing|09:30:00|09:44:00|14|840
2026-07-09|Thu|FS0426|Astin Ravi|cyber|09:23:00|09:53:00|30|1800
2026-07-09|Thu|FS0050|Avinash Pandian|cyber|09:12:00|09:42:00|30|1800
2026-07-09|Thu|FS0194|Bharathi Arjunan|dev|10:09:00|12:19:00|129|7800
2026-07-09|Thu|FS0377|Daniel Raj N|it support|10:13:00|10:19:00|5|360
2026-07-09|Thu|FS0195|David Mariyajebamalai|dev|09:45:00|10:01:00|15|960
2026-07-09|Thu|FS0303|Deepeka|dev|09:34:00|09:49:00|15|900
2026-07-09|Thu|FS0277|Deepesh Raj B|dev|11:28:00|11:43:00|15|900
2026-07-09|Thu|FS0243|DELLIBABU T|finance|09:26:00|09:56:00|30|1800
2026-07-09|Thu|FS0281|Dhanalakshmi S|dev|09:44:00|09:48:00|4|240
2026-07-09|Thu|FS0101|Dhiwan Mariappan|finance|07:44:00|08:14:00|30|1800
2026-07-09|Thu|FC0002|Dileep Thammana|finance|11:26:00|11:56:00|30|1800
2026-07-09|Thu|FS0046|Divya Priya Senthilkumaran|pm|10:09:00|10:09:00|0|0
2026-07-09|Thu|FS0284|Elaisha  Mothi E|dev|09:44:00|10:24:00|40|2400
2026-07-09|Thu|FS0319|Gokulakannan Duraisamy|ml|09:30:00|09:36:00|6|360
2026-07-09|Thu|FS0073|Gokulakannan Selvam|design|07:37:00|07:44:00|6|420
2026-07-09|Thu|FS0161|Haridha Muruganantham|erp|09:39:00|09:39:00|0|0
2026-07-09|Thu|FS0343|Hariharan Vijayakumar|erp|09:23:00|09:23:00|0|0
2026-07-09|Thu|FS0164|Harishkanna Baladhandapan|risk|03:51:00|03:51:00|0|0
2026-07-09|Thu|FS0036|Jai Surya S|design|09:57:00|10:18:00|21|1260
2026-07-09|Thu|FS0350|Janaki L|testing|09:30:00|10:09:00|38|2340
2026-07-09|Thu|FST0013|Kalashree A|finance|09:30:00|09:46:00|16|960
2026-07-09|Thu|FS0150|Karthikesan RajaRaman|dev|11:02:00|12:49:00|107|6420
2026-07-09|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|09:30:00|09:53:00|23|1380
2026-07-09|Thu|FS0158|Kishore Theiveekan|dev|09:29:00|08:39:00|1389|83400
2026-07-09|Thu|FS0126|Lakshmi Prasanna U|admin|10:34:00|10:34:00|0|0
2026-07-09|Thu|FS0437|Lenci Manuela L|it support|10:09:00|14:50:00|281|16860
2026-07-09|Thu|FST0022|Madhumitha Chandrasekaran|finance|10:31:00|11:01:00|30|1800
2026-07-09|Thu|FS0339|Magesh Kumar|cyber|09:44:00|12:30:00|166|9960
2026-07-09|Thu|FS0135|MAHESH T|cyber|01:19:00|01:49:00|30|1800
2026-07-09|Thu|FS0027|Manikadan P|design|10:33:00|11:34:00|61|3660
2026-07-09|Thu|FS0297|Maruthan G|dev|09:30:00|10:08:00|38|2280
2026-07-09|Thu|FS0298|Nantha Guru|dev|09:45:00|09:45:00|0|0
2026-07-09|Thu|FS0390|Naveen Prasad Moorthy|dev|09:03:00|09:07:00|4|240
2026-07-09|Thu|FS0287|Nedunchezhiyan  M|dev|00:51:00|20:57:00|1206|72360
2026-07-09|Thu|FS0321|Nithyanantham V|devops|09:06:00|09:21:00|15|900
2026-07-09|Thu|FS0322|Praveenkumar Saminathan|devops|09:30:00|09:30:00|0|0
2026-07-09|Thu|FST0011|Preethi Bernadath|finance|10:37:00|11:07:00|30|1800
2026-07-09|Thu|FS0393|Raja Balaji A|erp|08:38:00|08:38:00|0|0
2026-07-09|Thu|FS0424|Rajesh Pannirselvame|cyber|09:23:00|09:53:00|30|1800
2026-07-09|Thu|FS0398|Ranganathan C|erp|09:44:00|09:49:00|5|300
2026-07-09|Thu|FS0400|Rexlin Felix S|erp|10:13:00|12:24:00|130|7860
2026-07-09|Thu|FS0079|Sakthivel Mageshwaran|cyber|10:15:00|10:45:00|30|1800
2026-07-09|Thu|FS0438|Sangeetha Balasubramanian|testing|09:46:00|10:19:00|32|1980
2026-07-09|Thu|FS0409|Sanjay Boopathy M|finance|10:26:00|08:45:00|1338|80340
2026-07-09|Thu|FS0212|Santhosh Neelakandamoorthy|dev|10:17:00|10:22:00|4|300
2026-07-09|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:46:00|10:01:00|15|900
2026-07-09|Thu|FS0334|Sarathi S S|testing|09:45:00|10:26:00|40|2460
2026-07-09|Thu|FS0031|Saravana Pandian S|design|10:37:00|10:37:00|0|0
2026-07-09|Thu|FS0106|Saravanan Devendhiran|dev|09:11:00|09:26:00|15|900
2026-07-09|Thu|FS0231|Saritha Sekar|risk|09:52:00|09:52:00|0|0
2026-07-09|Thu|FS0148|Selvaprakash Balan|dev|09:39:00|09:54:00|15|900
2026-07-09|Thu|FS0125|Shahul Hameed Abdul Samad|risk|09:30:00|10:15:00|45|2700
2026-07-09|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:40:00|09:45:00|4|300
2026-07-09|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:36:00|09:36:00|0|0
2026-07-09|Thu|FS0391|Shashwath Pasupathi|erp|10:13:00|10:13:00|0|0
2026-07-09|Thu|FS0037|Sivashankaran P|dev|09:30:00|09:45:00|15|900
2026-07-09|Thu|FS0324|Sowmya Prabhu|testing|10:07:00|10:37:00|30|1800
2026-07-09|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:23:00|09:29:00|5|360
2026-07-09|Thu|FS0406|Sri Sai Teja Kolla|finance|09:47:00|10:17:00|30|1800
2026-07-09|Thu|FS0329|Sridhar Kumar S|erp|09:15:00|09:19:00|4|240
2026-07-09|Thu|FS0428|Sriganth Chennan|cyber|09:30:00|10:16:00|45|2760
2026-07-09|Thu|FS0318|Suresh Babu S|testing|09:08:00|09:38:00|30|1800
2026-07-09|Thu|FS0085|Suryapriya Saravanan|dev|09:45:00|09:49:00|4|240
2026-07-09|Thu|FS0430|Syed Riyas Niyas|cyber|09:52:00|12:29:00|156|9420
2026-07-09|Thu|FS0333|Theeban Babu S|dev|09:03:00|09:16:00|13|780
2026-07-09|Thu|FS0040|Veeravel Devaraj|ml|09:04:00|09:19:00|15|900
2026-07-09|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:02:00|10:32:00|30|1800
2026-07-09|Thu|FS0291|Vicky  Kumar|erp|09:20:00|09:26:00|5|360
2026-07-09|Thu|FS0353|Vishal Jayaraman|cyber|10:11:00|10:41:00|30|1800
2026-07-09|Thu|FS0341|Vishnu Priya|testing|09:45:00|10:27:00|42|2520
2026-07-09|Thu|FS0035|Vivek I|cyber|09:45:00|09:56:00|10|660
2026-07-09|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:24:00|09:24:00|0|0
2026-07-09|Thu|FS0090|Yogeswaran Murugavel|cyber|10:13:00|10:43:00|30|1800
2026-07-09|Thu|FS0407|Yuvaraj Santhanam|erp|10:13:00|10:39:00|25|1560
2026-07-10|Fri|FS0439|Abinesh Nagarajan|devops|09:30:00|09:31:00|0|60
2026-07-10|Fri|FS0414|Adam Gil Christ|it support|09:45:00|09:58:00|12|780
2026-07-10|Fri|FS0189|Ajay Parameswaran|dev|09:30:00|09:43:00|13|780
2026-07-10|Fri|FS0190|Anurag Virendrakumar|devops|09:43:00|09:58:00|15|900
2026-07-10|Fri|FS0342|Ashraf A|testing|09:45:00|09:54:00|9|540
2026-07-10|Fri|FS0426|Astin Ravi|cyber|09:03:00|09:33:00|30|1800
2026-07-10|Fri|FS0050|Avinash Pandian|cyber|10:22:00|10:52:00|30|1800
2026-07-10|Fri|FS0049|Balaji|dev|09:45:00|10:14:00|28|1740
2026-07-10|Fri|FS0015|Baskaran J|risk|09:45:00|10:29:00|44|2640
2026-07-10|Fri|FS0193|Bharath Selvam|data|09:30:00|10:15:00|44|2700
2026-07-10|Fri|FS0377|Daniel Raj N|it support|10:13:00|00:23:00|850|51000
2026-07-10|Fri|FS0195|David Mariyajebamalai|dev|11:09:00|11:16:00|7|420
2026-07-10|Fri|FS0303|Deepeka|dev|09:29:00|09:44:00|15|900
2026-07-10|Fri|FS0277|Deepesh Raj B|dev|10:20:00|10:35:00|15|900
2026-07-10|Fri|FS0281|Dhanalakshmi S|dev|09:53:00|09:58:00|4|300
2026-07-10|Fri|FS0046|Divya Priya Senthilkumaran|pm|10:15:00|10:15:00|0|0
2026-07-10|Fri|FS0284|Elaisha  Mothi E|dev|09:53:00|10:01:00|7|480
2026-07-10|Fri|FS0320|Gayathri K|data|09:18:00|09:33:00|15|900
2026-07-10|Fri|FS0319|Gokulakannan Duraisamy|ml|09:45:00|09:48:00|3|180
2026-07-10|Fri|FS0073|Gokulakannan Selvam|design|07:57:00|08:04:00|7|420
2026-07-10|Fri|FS0161|Haridha Muruganantham|erp|09:39:00|09:39:00|0|0
2026-07-10|Fri|FS0343|Hariharan Vijayakumar|erp|09:40:00|09:40:00|0|0
2026-07-10|Fri|FS0164|Harishkanna Baladhandapan|risk|04:01:00|04:01:00|0|0
2026-07-10|Fri|FST0013|Kalashree A|finance|11:20:00|12:02:00|42|2520
2026-07-10|Fri|FS0323|Kishore M|devops|09:45:00|09:50:00|5|300
2026-07-10|Fri|FS0158|Kishore Theiveekan|dev|10:02:00|10:16:00|14|840
2026-07-10|Fri|FST0022|Madhumitha Chandrasekaran|finance|09:50:00|10:20:00|30|1800
2026-07-10|Fri|FS0339|Magesh Kumar|cyber|09:41:00|09:45:00|4|240
2026-07-10|Fri|FS0135|MAHESH T|cyber|09:45:00|09:57:00|11|720
2026-07-10|Fri|FS0027|Manikadan P|design|10:25:00|10:32:00|7|420
2026-07-10|Fri|FS0297|Maruthan G|dev|09:45:00|09:58:00|12|780
2026-07-10|Fri|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|10:03:00|32|1980
2026-07-10|Fri|FS0390|Naveen Prasad Moorthy|dev|09:01:00|09:06:00|4|300
2026-07-10|Fri|FS0287|Nedunchezhiyan  M|dev|09:30:00|09:55:00|25|1500
2026-07-10|Fri|FS0321|Nithyanantham V|devops|09:41:00|09:56:00|15|900
2026-07-10|Fri|FS0306|PRAKASH K|dev|09:30:00|10:10:00|40|2400
2026-07-10|Fri|FS0322|Praveenkumar Saminathan|devops|09:30:00|09:56:00|25|1560
2026-07-10|Fri|FS0404|Prem Shankar S|erp|10:07:00|10:07:00|0|0
2026-07-10|Fri|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:09:00|23|1440
2026-07-10|Fri|FS0393|Raja Balaji A|erp|09:13:00|09:13:00|0|0
2026-07-10|Fri|FS0424|Rajesh Pannirselvame|cyber|08:22:00|08:52:00|30|1800
2026-07-10|Fri|FS0398|Ranganathan C|erp|09:39:00|09:43:00|4|240
2026-07-10|Fri|FS0400|Rexlin Felix S|erp|09:52:00|09:57:00|4|300
2026-07-10|Fri|FS0079|Sakthivel Mageshwaran|cyber|09:37:00|10:07:00|30|1800
2026-07-10|Fri|FS0438|Sangeetha Balasubramanian|testing|09:50:00|09:54:00|4|240
2026-07-10|Fri|FS0409|Sanjay Boopathy M|finance|10:27:00|10:57:00|30|1800
2026-07-10|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:53:00|09:57:00|4|240
2026-07-10|Fri|FS0442|Santhoshkumar Palanichamy|dev|09:43:00|09:58:00|15|900
2026-07-10|Fri|FS0334|Sarathi S S|testing|09:45:00|10:00:00|15|900
2026-07-10|Fri|FS0031|Saravana Pandian S|design|10:33:00|10:33:00|0|0
2026-07-10|Fri|FS0106|Saravanan Devendhiran|dev|09:31:00|09:46:00|15|900
2026-07-10|Fri|FS0231|Saritha Sekar|risk|10:15:00|10:15:00|0|0
2026-07-10|Fri|FS0148|Selvaprakash Balan|dev|09:41:00|09:56:00|15|900
2026-07-10|Fri|FS0125|Shahul Hameed Abdul Samad|risk|01:46:00|01:46:00|0|0
2026-07-10|Fri|FS0215|Shanmugam Mohanasundaram|dev|09:26:00|09:31:00|4|300
2026-07-10|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:31:00|09:31:00|0|0
2026-07-10|Fri|FS0391|Shashwath Pasupathi|erp|10:12:00|10:12:00|0|0
2026-07-10|Fri|FS0037|Sivashankaran P|dev|09:53:00|10:08:00|15|900
2026-07-10|Fri|FS0038|Sooriya Balaji Iyappan|dev|09:06:00|09:21:00|15|900
2026-07-10|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:24:00|09:30:00|6|360
2026-07-10|Fri|FS0406|Sri Sai Teja Kolla|finance|08:52:00|09:22:00|30|1800
2026-07-10|Fri|FS0329|Sridhar Kumar S|erp|09:45:00|09:51:00|5|360
2026-07-10|Fri|FS0428|Sriganth Chennan|cyber|09:57:00|10:27:00|30|1800
2026-07-10|Fri|FS0082|Stalin Innacimuthu|dev|09:45:00|10:23:00|38|2280
2026-07-10|Fri|FS0318|Suresh Babu S|testing|09:53:00|10:23:00|30|1800
2026-07-10|Fri|FS0430|Syed Riyas Niyas|cyber|09:46:00|09:53:00|6|420
2026-07-10|Fri|FS0040|Veeravel Devaraj|ml|10:39:00|10:54:00|15|900
2026-07-10|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:22:00|09:26:00|4|240
2026-07-10|Fri|FS0291|Vicky  Kumar|erp|09:41:00|09:51:00|10|600
2026-07-10|Fri|FS0325|Vijay Prakash A|testing|10:11:00|10:41:00|30|1800
2026-07-10|Fri|FS0353|Vishal Jayaraman|cyber|09:59:00|10:29:00|30|1800
2026-07-10|Fri|FS0219|Visvesvaran Kumaran|dev|09:30:00|10:12:00|41|2520
2026-07-10|Fri|FS0035|Vivek I|cyber|09:45:00|10:12:00|26|1620
2026-07-10|Fri|FS0089|Yogeshwaran Chandrakasan|dev|09:30:00|09:50:00|20|1200
2026-07-10|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:26:00|09:26:00|0|0
2026-07-10|Fri|FS0090|Yogeswaran Murugavel|cyber|09:45:00|09:48:00|3|180
2026-07-10|Fri|FS0407|Yuvaraj Santhanam|erp|10:02:00|10:06:00|4|240
2026-07-11|Sat|FS0414|Adam Gil Christ|it support|10:58:00|13:10:00|132|7920
2026-07-11|Sat|FS0426|Astin Ravi|cyber|08:04:00|08:34:00|30|1800
2026-07-11|Sat|FS0050|Avinash Pandian|cyber|11:19:00|11:49:00|30|1800
2026-07-11|Sat|FS0049|Balaji|dev|11:19:00|11:34:00|15|900
2026-07-11|Sat|FS0377|Daniel Raj N|it support|09:55:00|00:04:00|848|50940
2026-07-11|Sat|FS0243|DELLIBABU T|finance|09:40:00|10:10:00|30|1800
2026-07-11|Sat|FS0281|Dhanalakshmi S|dev|09:37:00|07:52:00|1334|80100
2026-07-11|Sat|FS0101|Dhiwan Mariappan|finance|07:50:00|07:55:00|5|300
2026-07-11|Sat|FC0002|Dileep Thammana|finance|10:54:00|11:24:00|30|1800
2026-07-11|Sat|FS0046|Divya Priya Senthilkumaran|pm|09:30:00|09:46:00|15|960
2026-07-11|Sat|FS0320|Gayathri K|data|09:26:00|09:41:00|15|900
2026-07-11|Sat|FS0319|Gokulakannan Duraisamy|ml|09:30:00|09:52:00|21|1320
2026-07-11|Sat|FS0073|Gokulakannan Selvam|design|08:01:00|08:08:00|6|420
2026-07-11|Sat|FS0161|Haridha Muruganantham|erp|09:34:00|09:34:00|0|0
2026-07-11|Sat|FS0343|Hariharan Vijayakumar|erp|09:18:00|09:18:00|0|0
2026-07-11|Sat|FS0036|Jai Surya S|design|09:39:00|10:11:00|31|1920
2026-07-11|Sat|FST0013|Kalashree A|finance|09:45:00|10:01:00|15|960
2026-07-11|Sat|FS0158|Kishore Theiveekan|dev|09:32:00|09:47:00|14|900
2026-07-11|Sat|FST0022|Madhumitha Chandrasekaran|finance|09:39:00|10:09:00|30|1800
2026-07-11|Sat|FS0339|Magesh Kumar|cyber|09:44:00|11:23:00|98|5940
2026-07-11|Sat|FS0135|MAHESH T|cyber|04:11:00|04:41:00|30|1800
2026-07-11|Sat|FS0390|Naveen Prasad Moorthy|dev|09:13:00|09:18:00|4|300
2026-07-11|Sat|FS0287|Nedunchezhiyan  M|dev|07:22:00|08:20:00|57|3480
2026-07-11|Sat|FS0321|Nithyanantham V|devops|08:37:00|08:52:00|15|900
2026-07-11|Sat|FS0404|Prem Shankar S|erp|10:49:00|10:49:00|0|0
2026-07-11|Sat|FS0424|Rajesh Pannirselvame|cyber|08:04:00|08:34:00|30|1800
2026-07-11|Sat|FS0398|Ranganathan C|erp|09:28:00|09:33:00|4|300
2026-07-11|Sat|FS0400|Rexlin Felix S|erp|10:00:00|10:00:00|0|0
2026-07-11|Sat|FS0079|Sakthivel Mageshwaran|cyber|09:39:00|10:09:00|30|1800
2026-07-11|Sat|FS0409|Sanjay Boopathy M|finance|10:31:00|08:53:00|1341|80520
2026-07-11|Sat|FS0212|Santhosh Neelakandamoorthy|dev|09:45:00|09:51:00|5|360
2026-07-11|Sat|FS0442|Santhoshkumar Palanichamy|dev|09:46:00|10:01:00|15|900
2026-07-11|Sat|FS0334|Sarathi S S|testing|09:30:00|09:48:00|17|1080
2026-07-11|Sat|FS0031|Saravana Pandian S|design|10:33:00|10:33:00|0|0
2026-07-11|Sat|FS0106|Saravanan Devendhiran|dev|08:49:00|09:04:00|15|900
2026-07-11|Sat|FS0148|Selvaprakash Balan|dev|09:25:00|09:40:00|15|900
2026-07-11|Sat|FS0125|Shahul Hameed Abdul Samad|risk|01:52:00|01:52:00|0|0
2026-07-11|Sat|FS0215|Shanmugam Mohanasundaram|dev|09:25:00|09:31:00|5|360
2026-07-11|Sat|FS0391|Shashwath Pasupathi|erp|10:07:00|10:07:00|0|0
2026-07-11|Sat|FS0324|Sowmya Prabhu|testing|09:51:00|10:21:00|30|1800
2026-07-11|Sat|FS0423|Sri Cibi Sivakumar|cyber|09:23:00|09:28:00|5|300
2026-07-11|Sat|FS0406|Sri Sai Teja Kolla|finance|08:56:00|09:26:00|30|1800
2026-07-11|Sat|FS0329|Sridhar Kumar S|erp|09:46:00|10:12:00|25|1560
2026-07-11|Sat|FS0428|Sriganth Chennan|cyber|10:00:00|10:30:00|30|1800
2026-07-11|Sat|FS0318|Suresh Babu S|testing|09:44:00|10:14:00|30|1800
2026-07-11|Sat|FS0430|Syed Riyas Niyas|cyber|10:08:00|10:13:00|4|300
2026-07-11|Sat|FS0333|Theeban Babu S|dev|08:08:00|08:13:00|5|300
2026-07-11|Sat|FS0291|Vicky  Kumar|erp|09:32:00|09:38:00|5|360
2026-07-11|Sat|FS0302|Vignesh  Babu|cyber|09:11:00|09:41:00|30|1800
2026-07-11|Sat|FS0325|Vijay Prakash A|testing|10:16:00|10:46:00|30|1800
2026-07-11|Sat|FS0035|Vivek I|cyber|09:30:00|09:50:00|19|1200
2026-07-11|Sat|FS0408|Yogeshwaran Govindaraj|erp|09:32:00|09:32:00|0|0
2026-07-11|Sat|FS0090|Yogeswaran Murugavel|cyber|09:54:00|10:24:00|30|1800
2026-07-11|Sat|FS0407|Yuvaraj Santhanam|erp|09:37:00|10:07:00|29|1800
2026-07-12|Sun|FS0287|Nedunchezhiyan  M|dev|09:45:00|10:00:00|15|900
2026-07-13|Mon|FS0439|Abinesh Nagarajan|devops|10:32:00|10:47:00|15|900
2026-07-13|Mon|FS0414|Adam Gil Christ|it support|10:52:00|10:58:00|5|360
2026-07-13|Mon|FS0292|Akash  B|dev|09:45:00|10:03:00|18|1080
2026-07-13|Mon|FS0021|ARJUN V|dev|07:40:00|07:55:00|15|900
2026-07-13|Mon|FS0426|Astin Ravi|cyber|09:22:00|09:52:00|30|1800
2026-07-13|Mon|FS0050|Avinash Pandian|cyber|09:14:00|09:44:00|30|1800
2026-07-13|Mon|FS0049|Balaji|dev|10:19:00|10:34:00|15|900
2026-07-13|Mon|FS0194|Bharathi Arjunan|dev|09:52:00|10:54:00|61|3720
2026-07-13|Mon|FS0377|Daniel Raj N|it support|10:26:00|11:23:00|57|3420
2026-07-13|Mon|FS0101|Dhiwan Mariappan|finance|09:30:00|09:33:00|2|180
2026-07-13|Mon|FC0002|Dileep Thammana|finance|09:45:00|10:10:00|25|1500
2026-07-13|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:58:00|10:58:00|0|0
2026-07-13|Mon|FS0320|Gayathri K|data|09:13:00|09:28:00|15|900
2026-07-13|Mon|FS0073|Gokulakannan Selvam|design|07:47:00|07:54:00|6|420
2026-07-13|Mon|FS0161|Haridha Muruganantham|erp|09:35:00|09:35:00|0|0
2026-07-13|Mon|FS0343|Hariharan Vijayakumar|erp|09:36:00|09:36:00|0|0
2026-07-13|Mon|FS0232|Jagadeesan Jayaraj|risk|09:30:00|10:11:00|41|2460
2026-07-13|Mon|FS0036|Jai Surya S|design|09:17:00|09:22:00|5|300
2026-07-13|Mon|FST0013|Kalashree A|finance|11:21:00|11:32:00|11|660
2026-07-13|Mon|FS0289|Kantha  Kumar K|dev|08:58:00|09:04:00|5|360
2026-07-13|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|09:16:00|00:12:00|895|53760
2026-07-13|Mon|FS0323|Kishore M|devops|10:32:00|00:00:00|807|48480
2026-07-13|Mon|FS0158|Kishore Theiveekan|dev|09:24:00|09:38:00|14|840
2026-07-13|Mon|FS0126|Lakshmi Prasanna U|admin|10:46:00|10:46:00|0|0
2026-07-13|Mon|FS0437|Lenci Manuela L|it support|09:55:00|11:25:00|90|5400
2026-07-13|Mon|FST0022|Madhumitha Chandrasekaran|finance|09:47:00|10:17:00|30|1800
2026-07-13|Mon|FS0339|Magesh Kumar|cyber|09:44:00|10:52:00|67|4080
2026-07-13|Mon|FS0135|MAHESH T|cyber|09:45:00|10:26:00|41|2460
2026-07-13|Mon|FS0027|Manikadan P|design|10:32:00|11:04:00|32|1920
2026-07-13|Mon|FS0298|Nantha Guru|dev|09:30:00|09:34:00|3|240
2026-07-13|Mon|FS0390|Naveen Prasad Moorthy|dev|08:58:00|09:04:00|5|360
2026-07-13|Mon|FS0287|Nedunchezhiyan  M|dev|09:06:00|06:41:00|1294|77700
2026-07-13|Mon|FS0154|Nethaji Srinivasan|dev|09:45:00|10:24:00|38|2340
2026-07-13|Mon|FS0321|Nithyanantham V|devops|09:03:00|09:18:00|15|900
2026-07-13|Mon|FS0306|PRAKASH K|dev|09:30:00|09:32:00|1|120
2026-07-13|Mon|FS0322|Praveenkumar Saminathan|devops|10:32:00|10:47:00|15|900
2026-07-13|Mon|FS0424|Rajesh Pannirselvame|cyber|10:07:00|10:37:00|30|1800
2026-07-13|Mon|FS0398|Ranganathan C|erp|09:27:00|09:33:00|5|360
2026-07-13|Mon|FS0400|Rexlin Felix S|erp|09:46:00|09:46:00|0|0
2026-07-13|Mon|FS0079|Sakthivel Mageshwaran|cyber|10:01:00|10:31:00|30|1800
2026-07-13|Mon|FS0438|Sangeetha Balasubramanian|testing|09:33:00|09:44:00|10|660
2026-07-13|Mon|FS0409|Sanjay Boopathy M|finance|09:45:00|10:11:00|26|1560
2026-07-13|Mon|FS0212|Santhosh Neelakandamoorthy|dev|09:57:00|10:12:00|15|900
2026-07-13|Mon|FS0442|Santhoshkumar Palanichamy|dev|09:26:00|09:41:00|15|900
2026-07-13|Mon|FS0003|Santosh Sai|finance|09:45:00|10:18:00|32|1980
2026-07-13|Mon|FS0031|Saravana Pandian S|design|10:42:00|10:42:00|0|0
2026-07-13|Mon|FS0106|Saravanan Devendhiran|dev|09:09:00|09:24:00|15|900
2026-07-13|Mon|FS0231|Saritha Sekar|risk|10:20:00|10:20:00|0|0
2026-07-13|Mon|FS0148|Selvaprakash Balan|dev|09:35:00|09:50:00|15|900
2026-07-13|Mon|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|09:53:00|7|480
2026-07-13|Mon|FS0215|Shanmugam Mohanasundaram|dev|09:41:00|09:45:00|4|240
2026-07-13|Mon|FS0022|Shashti Priyan shathiyavelu|design|09:37:00|09:37:00|0|0
2026-07-13|Mon|FS0391|Shashwath Pasupathi|erp|10:07:00|10:07:00|0|0
2026-07-13|Mon|FS0037|Sivashankaran P|dev|09:35:00|09:50:00|15|900
2026-07-13|Mon|FS0038|Sooriya Balaji Iyappan|dev|09:45:00|10:06:00|21|1260
2026-07-13|Mon|FS0324|Sowmya Prabhu|testing|09:42:00|10:12:00|30|1800
2026-07-13|Mon|FS0423|Sri Cibi Sivakumar|cyber|09:26:00|10:54:00|87|5280
2026-07-13|Mon|FS0406|Sri Sai Teja Kolla|finance|08:58:00|09:28:00|30|1800
2026-07-13|Mon|FS0329|Sridhar Kumar S|erp|09:28:00|09:44:00|16|960
2026-07-13|Mon|FS0428|Sriganth Chennan|cyber|09:45:00|09:45:00|0|0
2026-07-13|Mon|FS0318|Suresh Babu S|testing|09:57:00|10:27:00|30|1800
2026-07-13|Mon|FS0085|Suryapriya Saravanan|dev|09:30:00|09:52:00|21|1320
2026-07-13|Mon|FS0430|Syed Riyas Niyas|cyber|10:00:00|14:51:00|291|17460
2026-07-13|Mon|FS0333|Theeban Babu S|dev|08:58:00|09:03:00|4|300
2026-07-13|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:55:00|11:25:00|30|1800
2026-07-13|Mon|FS0291|Vicky  Kumar|erp|09:24:00|09:24:00|0|0
2026-07-13|Mon|FS0302|Vignesh  Babu|cyber|08:41:00|09:11:00|30|1800
2026-07-13|Mon|FS0325|Vijay Prakash A|testing|09:43:00|10:13:00|30|1800
2026-07-13|Mon|FS0239|VIJAY S R|testing|09:45:00|09:52:00|6|420
2026-07-13|Mon|FS0353|Vishal Jayaraman|cyber|09:45:00|10:00:00|14|900
2026-07-13|Mon|FS0035|Vivek I|cyber|09:45:00|10:02:00|17|1020
2026-07-13|Mon|FS0090|Yogeswaran Murugavel|cyber|09:16:00|09:46:00|30|1800
2026-07-13|Mon|FS0407|Yuvaraj Santhanam|erp|10:09:00|12:16:00|126|7620
2026-07-14|Tue|FS0414|Adam Gil Christ|it support|10:01:00|00:07:00|845|50760
2026-07-14|Tue|FS0292|Akash  B|dev|10:53:00|11:08:00|15|900
2026-07-14|Tue|FS0021|ARJUN V|dev|08:08:00|08:23:00|15|900
2026-07-14|Tue|FS0426|Astin Ravi|cyber|09:37:00|10:07:00|30|1800
2026-07-14|Tue|FS0050|Avinash Pandian|cyber|09:00:00|09:30:00|30|1800
2026-07-14|Tue|FS0049|Balaji|dev|10:35:00|10:50:00|15|900
2026-07-14|Tue|FS0194|Bharathi Arjunan|dev|09:55:00|14:42:00|286|17220
2026-07-14|Tue|FS0377|Daniel Raj N|it support|09:07:00|09:13:00|5|360
2026-07-14|Tue|FS0303|Deepeka|dev|09:31:00|09:46:00|15|900
2026-07-14|Tue|FS0277|Deepesh Raj B|dev|11:01:00|11:16:00|15|900
2026-07-14|Tue|FS0243|DELLIBABU T|finance|09:50:00|10:20:00|30|1800
2026-07-14|Tue|FS0281|Dhanalakshmi S|dev|09:39:00|09:44:00|5|300
2026-07-14|Tue|FC0002|Dileep Thammana|finance|09:45:00|09:52:00|7|420
2026-07-14|Tue|FS0046|Divya Priya Senthilkumaran|pm|09:40:00|09:40:00|0|0
2026-07-14|Tue|FS0284|Elaisha  Mothi E|dev|09:50:00|11:57:00|127|7620
2026-07-14|Tue|FS0320|Gayathri K|data|09:30:00|09:45:00|15|900
2026-07-14|Tue|FS0073|Gokulakannan Selvam|design|07:57:00|08:03:00|6|360
2026-07-14|Tue|FS0161|Haridha Muruganantham|erp|09:38:00|09:38:00|0|0
2026-07-14|Tue|FS0343|Hariharan Vijayakumar|erp|09:26:00|09:26:00|0|0
2026-07-14|Tue|FS0164|Harishkanna Baladhandapan|risk|09:30:00|09:33:00|2|180
2026-07-14|Tue|FS0425|Jayachandran Iswaran|cyber|09:52:00|11:52:00|119|7200
2026-07-14|Tue|FS0237|JONES  KAPIL L|testing|10:36:00|11:06:00|30|1800
2026-07-14|Tue|FST0013|Kalashree A|finance|09:45:00|10:18:00|32|1980
2026-07-14|Tue|FS0289|Kantha  Kumar K|dev|09:03:00|09:07:00|4|240
2026-07-14|Tue|FS0150|Karthikesan RajaRaman|dev|09:27:00|09:27:00|1439|0
2026-07-14|Tue|FS0200|Kavinkumar Ramasamy|dev|09:45:00|09:51:00|5|360
2026-07-14|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:53:00|00:00:00|846|50820
2026-07-14|Tue|FS0158|Kishore Theiveekan|dev|09:40:00|09:54:00|14|840
2026-07-14|Tue|FS0126|Lakshmi Prasanna U|admin|10:57:00|10:57:00|0|0
2026-07-14|Tue|FS0437|Lenci Manuela L|it support|09:50:00|10:45:00|54|3300
2026-07-14|Tue|FST0022|Madhumitha Chandrasekaran|finance|09:40:00|10:10:00|30|1800
2026-07-14|Tue|FS0339|Magesh Kumar|cyber|09:42:00|14:52:00|309|18600
2026-07-14|Tue|FS0135|MAHESH T|cyber|02:15:00|02:45:00|30|1800
2026-07-14|Tue|FS0027|Manikadan P|design|10:33:00|12:04:00|90|5460
2026-07-14|Tue|FS0427|Mukesh Muthusamy|cyber|09:17:00|09:47:00|30|1800
2026-07-14|Tue|FS0390|Naveen Prasad Moorthy|dev|09:12:00|09:17:00|4|300
2026-07-14|Tue|FS0321|Nithyanantham V|devops|09:13:00|09:28:00|15|900
2026-07-14|Tue|FS0306|PRAKASH K|dev|08:46:00|09:01:00|15|900
2026-07-14|Tue|FS0404|Prem Shankar S|erp|10:46:00|10:46:00|0|0
2026-07-14|Tue|FS0144|Ragul Priyan Murugan|dev|09:30:00|10:01:00|30|1860
2026-07-14|Tue|FS0393|Raja Balaji A|erp|08:29:00|08:29:00|0|0
2026-07-14|Tue|FS0424|Rajesh Pannirselvame|cyber|09:37:00|10:07:00|30|1800
2026-07-14|Tue|FS0398|Ranganathan C|erp|09:22:00|09:27:00|4|300
2026-07-14|Tue|FS0400|Rexlin Felix S|erp|09:48:00|09:48:00|0|0
2026-07-14|Tue|FS0079|Sakthivel Mageshwaran|cyber|10:03:00|10:33:00|30|1800
2026-07-14|Tue|FS0438|Sangeetha Balasubramanian|testing|09:26:00|09:31:00|4|300
2026-07-14|Tue|FS0409|Sanjay Boopathy M|finance|10:01:00|08:34:00|1352|81180
2026-07-14|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:36:00|09:51:00|15|900
2026-07-14|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:08:00|09:23:00|15|900
2026-07-14|Tue|FS0003|Santosh Sai|finance|09:26:00|09:56:00|30|1800
2026-07-14|Tue|FS0031|Saravana Pandian S|design|10:39:00|10:39:00|0|0
2026-07-14|Tue|FS0106|Saravanan Devendhiran|dev|09:09:00|09:24:00|15|900
2026-07-14|Tue|FS0148|Selvaprakash Balan|dev|09:26:00|09:41:00|15|900
2026-07-14|Tue|FS0125|Shahul Hameed Abdul Samad|risk|01:15:00|01:15:00|0|0
2026-07-14|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:39:00|09:44:00|4|300
2026-07-14|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:37:00|09:37:00|0|0
2026-07-14|Tue|FS0037|Sivashankaran P|dev|09:18:00|09:33:00|15|900
2026-07-14|Tue|FS0038|Sooriya Balaji Iyappan|dev|09:30:00|09:45:00|15|900
2026-07-14|Tue|FS0324|Sowmya Prabhu|testing|09:53:00|10:23:00|30|1800
2026-07-14|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:22:00|09:27:00|5|300
2026-07-14|Tue|FS0406|Sri Sai Teja Kolla|finance|08:47:00|09:17:00|30|1800
2026-07-14|Tue|FS0329|Sridhar Kumar S|erp|09:27:00|09:33:00|5|360
2026-07-14|Tue|FS0428|Sriganth Chennan|cyber|10:03:00|10:33:00|30|1800
2026-07-14|Tue|FS0318|Suresh Babu S|testing|09:26:00|09:56:00|30|1800
2026-07-14|Tue|FS0085|Suryapriya Saravanan|dev|10:31:00|10:46:00|15|900
2026-07-14|Tue|FS0430|Syed Riyas Niyas|cyber|09:47:00|11:47:00|119|7200
2026-07-14|Tue|FS0333|Theeban Babu S|dev|09:12:00|09:17:00|4|300
2026-07-14|Tue|FS0040|Veeravel Devaraj|ml|01:29:00|01:44:00|15|900
2026-07-14|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:03:00|10:33:00|30|1800
2026-07-14|Tue|FS0291|Vicky  Kumar|erp|09:39:00|09:45:00|5|360
2026-07-14|Tue|FS0302|Vignesh  Babu|cyber|08:48:00|09:18:00|30|1800
2026-07-14|Tue|FS0325|Vijay Prakash A|testing|10:07:00|10:37:00|30|1800
2026-07-14|Tue|FS0353|Vishal Jayaraman|cyber|10:39:00|11:09:00|30|1800
2026-07-14|Tue|FS0035|Vivek I|cyber|11:21:00|11:51:00|30|1800
2026-07-14|Tue|FS0090|Yogeswaran Murugavel|cyber|10:01:00|10:31:00|30|1800
2026-07-14|Tue|FS0407|Yuvaraj Santhanam|erp|09:46:00|11:46:00|120|7200
2026-07-15|Wed|FS0414|Adam Gil Christ|it support|10:03:00|10:08:00|4|300
2026-07-15|Wed|FS0152|Ajith Kumar Ramalingam|dev|09:45:00|09:57:00|11|720
2026-07-15|Wed|FS0292|Akash  B|dev|11:12:00|11:27:00|15|900
2026-07-15|Wed|FS0190|Anurag Virendrakumar|devops|09:30:00|09:42:00|12|720
2026-07-15|Wed|FS0021|ARJUN V|dev|08:45:00|09:00:00|15|900
2026-07-15|Wed|FS0342|Ashraf A|testing|09:30:00|09:48:00|17|1080
2026-07-15|Wed|FS0426|Astin Ravi|cyber|08:36:00|09:06:00|30|1800
2026-07-15|Wed|FS0050|Avinash Pandian|cyber|09:49:00|10:19:00|30|1800
2026-07-15|Wed|FS0049|Balaji|dev|10:18:00|10:33:00|15|900
2026-07-15|Wed|FS0194|Bharathi Arjunan|dev|10:05:00|07:45:00|1300|78000
2026-07-15|Wed|FS0377|Daniel Raj N|it support|09:14:00|09:18:00|4|240
2026-07-15|Wed|FS0195|David Mariyajebamalai|dev|09:30:00|10:11:00|41|2460
2026-07-15|Wed|FS0303|Deepeka|dev|09:51:00|10:06:00|15|900
2026-07-15|Wed|FS0243|DELLIBABU T|finance|09:13:00|09:43:00|30|1800
2026-07-15|Wed|FS0281|Dhanalakshmi S|dev|09:51:00|09:56:00|5|300
2026-07-15|Wed|FS0101|Dhiwan Mariappan|finance|08:05:00|08:35:00|30|1800
2026-07-15|Wed|FC0002|Dileep Thammana|finance|11:13:00|11:43:00|30|1800
2026-07-15|Wed|FS0046|Divya Priya Senthilkumaran|pm|10:25:00|10:25:00|0|0
2026-07-15|Wed|FS0284|Elaisha  Mothi E|dev|09:51:00|10:58:00|67|4020
2026-07-15|Wed|FS0311|Ganesh D|design|09:45:00|10:05:00|20|1200
2026-07-15|Wed|FS0320|Gayathri K|data|09:27:00|09:42:00|15|900
2026-07-15|Wed|FS0319|Gokulakannan Duraisamy|ml|09:30:00|09:46:00|16|960
2026-07-15|Wed|FS0073|Gokulakannan Selvam|design|07:46:00|07:53:00|7|420
2026-07-15|Wed|FS0161|Haridha Muruganantham|erp|09:45:00|09:45:00|0|0
2026-07-15|Wed|FS0343|Hariharan Vijayakumar|erp|09:32:00|09:32:00|0|0
2026-07-15|Wed|FS0036|Jai Surya S|design|10:15:00|10:58:00|42|2580
2026-07-15|Wed|FS0425|Jayachandran Iswaran|cyber|09:25:00|09:30:00|5|300
2026-07-15|Wed|FS0237|JONES  KAPIL L|testing|10:35:00|11:05:00|30|1800
2026-07-15|Wed|FST0013|Kalashree A|finance|11:10:00|00:15:00|785|47100
2026-07-15|Wed|FS0289|Kantha  Kumar K|dev|09:17:00|09:23:00|5|360
2026-07-15|Wed|FS0150|Karthikesan RajaRaman|dev|09:29:00|09:29:00|0|0
2026-07-15|Wed|FS0433|keerthivaasen.v@finstein.ai|cyber|09:09:00|09:19:00|10|600
2026-07-15|Wed|FS0158|Kishore Theiveekan|dev|09:38:00|09:51:00|13|780
2026-07-15|Wed|FS0126|Lakshmi Prasanna U|admin|10:14:00|10:14:00|0|0
2026-07-15|Wed|FS0437|Lenci Manuela L|it support|09:59:00|09:35:00|1416|84960
2026-07-15|Wed|FST0022|Madhumitha Chandrasekaran|finance|09:04:00|09:34:00|30|1800
2026-07-15|Wed|FS0339|Magesh Kumar|cyber|09:36:00|09:41:00|4|300
2026-07-15|Wed|FS0135|MAHESH T|cyber|00:18:00|00:48:00|30|1800
2026-07-15|Wed|FS0427|Mukesh Muthusamy|cyber|09:30:00|10:00:00|30|1800
2026-07-15|Wed|FS0390|Naveen Prasad Moorthy|dev|09:11:00|09:16:00|4|300
2026-07-15|Wed|FS0287|Nedunchezhiyan  M|dev|00:12:00|09:10:00|538|32280
2026-07-15|Wed|FS0321|Nithyanantham V|devops|09:09:00|09:24:00|15|900
2026-07-15|Wed|FS0306|PRAKASH K|dev|09:45:00|10:03:00|18|1080
2026-07-15|Wed|FS0393|Raja Balaji A|erp|08:30:00|08:30:00|0|0
2026-07-15|Wed|FS0424|Rajesh Pannirselvame|cyber|08:36:00|09:06:00|30|1800
2026-07-15|Wed|FS0398|Ranganathan C|erp|09:39:00|09:44:00|4|300
2026-07-15|Wed|FS0400|Rexlin Felix S|erp|10:34:00|10:34:00|0|0
2026-07-15|Wed|FS0079|Sakthivel Mageshwaran|cyber|09:56:00|10:26:00|30|1800
2026-07-15|Wed|FS0438|Sangeetha Balasubramanian|testing|09:34:00|09:38:00|4|240
2026-07-15|Wed|FS0409|Sanjay Boopathy M|finance|10:03:00|08:35:00|1351|81120
2026-07-15|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:34:00|09:49:00|15|900
2026-07-15|Wed|FS0334|Sarathi S S|testing|09:41:00|10:11:00|30|1800
2026-07-15|Wed|FS0031|Saravana Pandian S|design|10:32:00|10:32:00|0|0
2026-07-15|Wed|FS0148|Selvaprakash Balan|dev|09:24:00|09:39:00|15|900
2026-07-15|Wed|FS0125|Shahul Hameed Abdul Samad|risk|04:23:00|04:23:00|0|0
2026-07-15|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:12:00|09:16:00|4|240
2026-07-15|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:42:00|09:42:00|0|0
2026-07-15|Wed|FS0391|Shashwath Pasupathi|erp|09:51:00|09:51:00|0|0
2026-07-15|Wed|FS0037|Sivashankaran P|dev|09:27:00|09:42:00|15|900
2026-07-15|Wed|FS0038|Sooriya Balaji Iyappan|dev|00:52:00|01:07:00|15|900
2026-07-15|Wed|FS0324|Sowmya Prabhu|testing|09:51:00|10:21:00|30|1800
2026-07-15|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:25:00|09:30:00|4|300
2026-07-15|Wed|FS0406|Sri Sai Teja Kolla|finance|08:53:00|09:23:00|30|1800
2026-07-15|Wed|FS0329|Sridhar Kumar S|erp|09:27:00|09:32:00|5|300
2026-07-15|Wed|FS0428|Sriganth Chennan|cyber|09:30:00|10:04:00|33|2040
2026-07-15|Wed|FS0318|Suresh Babu S|testing|09:31:00|10:01:00|30|1800
2026-07-15|Wed|FS0430|Syed Riyas Niyas|cyber|10:01:00|10:50:00|49|2940
2026-07-15|Wed|FS0333|Theeban Babu S|dev|09:11:00|09:16:00|4|300
2026-07-15|Wed|FS0040|Veeravel Devaraj|ml|01:39:00|01:54:00|15|900
2026-07-15|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:55:00|10:25:00|30|1800
2026-07-15|Wed|FS0291|Vicky  Kumar|erp|09:25:00|09:30:00|5|300
2026-07-15|Wed|FS0302|Vignesh  Babu|cyber|08:48:00|09:18:00|30|1800
2026-07-15|Wed|FS0325|Vijay Prakash A|testing|09:56:00|10:26:00|30|1800
2026-07-15|Wed|FS0353|Vishal Jayaraman|cyber|09:45:00|10:12:00|26|1620
2026-07-15|Wed|FS0035|Vivek I|cyber|09:45:00|10:30:00|45|2700
2026-07-15|Wed|FS0089|Yogeshwaran Chandrakasan|dev|09:45:00|09:57:00|12|720
2026-07-15|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:42:00|09:42:00|0|0
2026-07-15|Wed|FS0407|Yuvaraj Santhanam|erp|09:45:00|10:33:00|47|2880
2026-07-16|Thu|FS0190|Anurag Virendrakumar|devops|09:39:00|09:54:00|15|900
2026-07-16|Thu|FS0018|Asmath Nisha|finance|09:35:00|09:40:00|5|300
2026-07-16|Thu|FS0426|Astin Ravi|cyber|09:32:00|10:02:00|30|1800
2026-07-16|Thu|FS0050|Avinash Pandian|cyber|08:25:00|08:55:00|30|1800
2026-07-16|Thu|FS0049|Balaji|dev|10:04:00|10:19:00|15|900
2026-07-16|Thu|FS0194|Bharathi Arjunan|dev|10:10:00|10:25:00|15|900
2026-07-16|Thu|FS0377|Daniel Raj N|it support|09:30:00|09:34:00|4|240
2026-07-16|Thu|FS0195|David Mariyajebamalai|dev|09:45:00|10:15:00|29|1800
2026-07-16|Thu|FS0303|Deepeka|dev|09:27:00|09:42:00|15|900
2026-07-16|Thu|FS0243|DELLIBABU T|finance|09:33:00|10:03:00|30|1800
2026-07-16|Thu|FS0281|Dhanalakshmi S|dev|09:28:00|07:08:00|1300|78000
2026-07-16|Thu|FS0101|Dhiwan Mariappan|finance|07:51:00|08:21:00|30|1800
2026-07-16|Thu|FS0046|Divya Priya Senthilkumaran|pm|10:33:00|10:33:00|0|0
2026-07-16|Thu|FS0161|Haridha Muruganantham|erp|10:16:00|10:16:00|0|0
2026-07-16|Thu|FS0343|Hariharan Vijayakumar|erp|09:17:00|09:17:00|0|0
2026-07-16|Thu|FS0036|Jai Surya S|design|09:52:00|10:01:00|8|540
2026-07-16|Thu|FS0425|Jayachandran Iswaran|cyber|09:27:00|09:32:00|5|300
2026-07-16|Thu|FST0013|Kalashree A|finance|11:28:00|11:37:00|9|540
2026-07-16|Thu|FS0289|Kantha  Kumar K|dev|08:58:00|09:02:00|4|240
2026-07-16|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|09:52:00|09:58:00|5|360
2026-07-16|Thu|FS0158|Kishore Theiveekan|dev|09:30:00|09:40:00|9|600
2026-07-16|Thu|FS0126|Lakshmi Prasanna U|admin|10:37:00|10:37:00|0|0
2026-07-16|Thu|FS0437|Lenci Manuela L|it support|09:14:00|09:58:00|43|2640
2026-07-16|Thu|FST0022|Madhumitha Chandrasekaran|finance|09:30:00|09:49:00|18|1140
2026-07-16|Thu|FS0339|Magesh Kumar|cyber|09:49:00|09:54:00|4|300
2026-07-16|Thu|FS0135|MAHESH T|cyber|03:41:00|04:11:00|30|1800
2026-07-16|Thu|FS0427|Mukesh Muthusamy|cyber|09:23:00|09:53:00|30|1800
2026-07-16|Thu|FS0390|Naveen Prasad Moorthy|dev|09:14:00|09:19:00|5|300
2026-07-16|Thu|FS0287|Nedunchezhiyan  M|dev|09:45:00|09:55:00|10|600
2026-07-16|Thu|FS0321|Nithyanantham V|devops|09:21:00|09:36:00|15|900
2026-07-16|Thu|FS0306|PRAKASH K|dev|08:38:00|08:53:00|15|900
2026-07-16|Thu|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:24:00|39|2340
2026-07-16|Thu|FS0393|Raja Balaji A|erp|08:41:00|08:41:00|0|0
2026-07-16|Thu|FS0424|Rajesh Pannirselvame|cyber|09:32:00|10:02:00|30|1800
2026-07-16|Thu|FS0398|Ranganathan C|erp|09:25:00|01:33:00|967|58080
2026-07-16|Thu|FS0400|Rexlin Felix S|erp|09:53:00|09:53:00|0|0
2026-07-16|Thu|FS0079|Sakthivel Mageshwaran|cyber|09:57:00|10:27:00|30|1800
2026-07-16|Thu|FS0438|Sangeetha Balasubramanian|testing|09:35:00|09:39:00|4|240
2026-07-16|Thu|FS0409|Sanjay Boopathy M|finance|10:23:00|08:46:00|1342|80580
2026-07-16|Thu|FS0212|Santhosh Neelakandamoorthy|dev|09:27:00|09:42:00|15|900
2026-07-16|Thu|FS0442|Santhoshkumar Palanichamy|dev|10:20:00|10:35:00|15|900
2026-07-16|Thu|FS0334|Sarathi S S|testing|09:45:00|10:22:00|37|2220
2026-07-16|Thu|FS0106|Saravanan Devendhiran|dev|09:35:00|09:50:00|15|900
2026-07-16|Thu|FS0231|Saritha Sekar|risk|10:10:00|10:10:00|0|0
2026-07-16|Thu|FS0148|Selvaprakash Balan|dev|09:28:00|09:43:00|15|900
2026-07-16|Thu|FS0125|Shahul Hameed Abdul Samad|risk|00:25:00|00:25:00|0|0
2026-07-16|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:55:00|10:00:00|4|300
2026-07-16|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:41:00|09:41:00|0|0
2026-07-16|Thu|FS0391|Shashwath Pasupathi|erp|09:54:00|09:54:00|0|0
2026-07-16|Thu|FS0037|Sivashankaran P|dev|09:49:00|10:04:00|15|900
2026-07-16|Thu|FS0038|Sooriya Balaji Iyappan|dev|01:55:00|02:10:00|15|900
2026-07-16|Thu|FS0324|Sowmya Prabhu|testing|10:05:00|10:35:00|30|1800
2026-07-16|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:27:00|09:32:00|5|300
2026-07-16|Thu|FS0406|Sri Sai Teja Kolla|finance|08:52:00|09:22:00|30|1800
2026-07-16|Thu|FS0329|Sridhar Kumar S|erp|09:16:00|09:21:00|5|300
2026-07-16|Thu|FS0428|Sriganth Chennan|cyber|09:30:00|10:03:00|33|1980
2026-07-16|Thu|FS0318|Suresh Babu S|testing|09:53:00|10:23:00|30|1800
2026-07-16|Thu|FS0085|Suryapriya Saravanan|dev|09:30:00|09:32:00|2|120
2026-07-16|Thu|FS0430|Syed Riyas Niyas|cyber|10:07:00|10:15:00|8|480
2026-07-16|Thu|FS0333|Theeban Babu S|dev|09:14:00|09:19:00|4|300
2026-07-16|Thu|FS0040|Veeravel Devaraj|ml|00:01:00|00:16:00|15|900
2026-07-16|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:02:00|10:32:00|30|1800
2026-07-16|Thu|FS0291|Vicky  Kumar|erp|09:25:00|09:30:00|5|300
2026-07-16|Thu|FS0302|Vignesh  Babu|cyber|09:03:00|09:33:00|30|1800
2026-07-16|Thu|FS0325|Vijay Prakash A|testing|10:04:00|10:34:00|30|1800
2026-07-16|Thu|FS0353|Vishal Jayaraman|cyber|10:01:00|10:31:00|30|1800
2026-07-16|Thu|FS0035|Vivek I|cyber|02:01:00|02:31:00|30|1800
2026-07-16|Thu|FS0089|Yogeshwaran Chandrakasan|dev|09:30:00|09:36:00|6|360
2026-07-16|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:25:00|09:25:00|0|0
2026-07-16|Thu|FS0090|Yogeswaran Murugavel|cyber|09:29:00|09:59:00|30|1800
2026-07-16|Thu|FS0407|Yuvaraj Santhanam|erp|09:32:00|09:37:00|4|300
2026-07-17|Fri|FS0439|Abinesh Nagarajan|devops|09:45:00|10:10:00|24|1500
2026-07-17|Fri|FS0189|Ajay Parameswaran|dev|09:30:00|10:02:00|31|1920
2026-07-17|Fri|FS0021|ARJUN V|dev|07:50:00|08:05:00|15|900
2026-07-17|Fri|FS0342|Ashraf A|testing|09:45:00|09:47:00|1|120
2026-07-17|Fri|FS0426|Astin Ravi|cyber|09:04:00|09:34:00|30|1800
2026-07-17|Fri|FS0050|Avinash Pandian|cyber|10:21:00|10:51:00|30|1800
2026-07-17|Fri|FS0049|Balaji|dev|10:21:00|10:36:00|15|900
2026-07-17|Fri|FS0194|Bharathi Arjunan|dev|10:03:00|10:22:00|19|1140
2026-07-17|Fri|FS0377|Daniel Raj N|it support|09:57:00|00:01:00|844|50640
2026-07-17|Fri|FS0195|David Mariyajebamalai|dev|11:09:00|11:20:00|10|660
2026-07-17|Fri|FS0340|Deepa K|testing|09:30:00|10:12:00|42|2520
2026-07-17|Fri|FS0303|Deepeka|dev|09:25:00|09:40:00|15|900
2026-07-17|Fri|FS0277|Deepesh Raj B|dev|10:42:00|10:57:00|15|900
2026-07-17|Fri|FS0243|DELLIBABU T|finance|09:21:00|09:51:00|30|1800
2026-07-17|Fri|FS0281|Dhanalakshmi S|dev|09:42:00|09:48:00|5|360
2026-07-17|Fri|FC0002|Dileep Thammana|finance|09:45:00|10:13:00|28|1680
2026-07-17|Fri|FS0311|Ganesh D|design|09:30:00|09:44:00|14|840
2026-07-17|Fri|FS0320|Gayathri K|data|09:30:00|09:45:00|15|900
2026-07-17|Fri|FS0228|Geetha Karnan|risk|09:30:00|10:01:00|30|1860
2026-07-17|Fri|FS0319|Gokulakannan Duraisamy|ml|09:45:00|09:51:00|5|360
2026-07-17|Fri|FS0161|Haridha Muruganantham|erp|09:36:00|09:36:00|0|0
2026-07-17|Fri|FS0036|Jai Surya S|design|10:16:00|10:21:00|5|300
2026-07-17|Fri|FS0350|Janaki L|testing|09:45:00|10:07:00|21|1320
2026-07-17|Fri|FS0237|JONES  KAPIL L|testing|09:45:00|09:55:00|9|600
2026-07-17|Fri|FST0013|Kalashree A|finance|11:29:00|00:00:00|751|45060
2026-07-17|Fri|FS0289|Kantha  Kumar K|dev|09:00:00|09:09:00|8|540
2026-07-17|Fri|FS0150|Karthikesan RajaRaman|dev|09:45:00|09:57:00|11|720
2026-07-17|Fri|FS0433|keerthivaasen.v@finstein.ai|cyber|09:45:00|10:11:00|26|1560
2026-07-17|Fri|FS0323|Kishore M|devops|09:30:00|10:11:00|41|2460
2026-07-17|Fri|FS0158|Kishore Theiveekan|dev|09:45:00|09:58:00|13|780
2026-07-17|Fri|FS0437|Lenci Manuela L|it support|10:49:00|09:48:00|1378|82740
2026-07-17|Fri|FST0022|Madhumitha Chandrasekaran|finance|09:32:00|10:02:00|30|1800
2026-07-17|Fri|FS0339|Magesh Kumar|cyber|09:34:00|09:39:00|4|300
2026-07-17|Fri|FS0326|Mahasri Seenivasan|data|09:38:00|09:43:00|5|300
2026-07-17|Fri|FS0135|MAHESH T|cyber|09:45:00|10:09:00|23|1440
2026-07-17|Fri|FS0027|Manikadan P|design|10:33:00|10:48:00|14|900
2026-07-17|Fri|FS0297|Maruthan G|dev|09:45:00|10:13:00|28|1680
2026-07-17|Fri|FS0076|Meena Rajendran|testing|09:30:00|09:30:00|0|0
2026-07-17|Fri|FS0298|Nantha Guru|dev|09:30:00|09:52:00|21|1320
2026-07-17|Fri|FS0390|Naveen Prasad Moorthy|dev|09:03:00|09:08:00|4|300
2026-07-17|Fri|FS0371|Navin D|dev|09:45:00|10:25:00|39|2400
2026-07-17|Fri|FS0287|Nedunchezhiyan  M|dev|07:10:00|08:57:00|107|6420
2026-07-17|Fri|FS0154|Nethaji Srinivasan|dev|09:30:00|09:48:00|18|1080
2026-07-17|Fri|FS0321|Nithyanantham V|devops|09:48:00|10:03:00|15|900
2026-07-17|Fri|FS0306|PRAKASH K|dev|09:30:00|09:45:00|15|900
2026-07-17|Fri|FS0322|Praveenkumar Saminathan|devops|09:45:00|10:30:00|45|2700
2026-07-17|Fri|FS0404|Prem Shankar S|erp|10:42:00|10:42:00|0|0
2026-07-17|Fri|FS0144|Ragul Priyan Murugan|dev|09:45:00|09:48:00|3|180
2026-07-17|Fri|FS0393|Raja Balaji A|erp|08:45:00|08:45:00|0|0
2026-07-17|Fri|FS0331|Rajesh Kumar A|testing|09:30:00|09:39:00|9|540
2026-07-17|Fri|FS0424|Rajesh Pannirselvame|cyber|09:04:00|09:34:00|30|1800
2026-07-17|Fri|FS0398|Ranganathan C|erp|09:34:00|06:53:00|1279|76740
2026-07-17|Fri|FS0400|Rexlin Felix S|erp|10:02:00|10:02:00|0|0
2026-07-17|Fri|FS0079|Sakthivel Mageshwaran|cyber|09:43:00|10:13:00|30|1800
2026-07-17|Fri|FS0438|Sangeetha Balasubramanian|testing|09:37:00|09:42:00|4|300
2026-07-17|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:51:00|10:06:00|15|900
2026-07-17|Fri|FS0442|Santhoshkumar Palanichamy|dev|10:09:00|10:24:00|15|900
2026-07-17|Fri|FS0031|Saravana Pandian S|design|10:39:00|10:39:00|0|0
2026-07-17|Fri|FS0106|Saravanan Devendhiran|dev|09:25:00|09:40:00|15|900
2026-07-17|Fri|FS0148|Selvaprakash Balan|dev|09:45:00|10:00:00|15|900
2026-07-17|Fri|FS0080|Shamili Anbuselvan|dev|09:30:00|09:58:00|27|1680
2026-07-17|Fri|FS0215|Shanmugam Mohanasundaram|dev|10:18:00|10:23:00|4|300
2026-07-17|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:17:00|09:17:00|0|0
2026-07-17|Fri|FS0391|Shashwath Pasupathi|erp|10:08:00|10:08:00|0|0
2026-07-17|Fri|FS0037|Sivashankaran P|dev|09:34:00|09:49:00|15|900
2026-07-17|Fri|FS0038|Sooriya Balaji Iyappan|dev|00:10:00|00:25:00|15|900
2026-07-17|Fri|FS0324|Sowmya Prabhu|testing|09:54:00|10:24:00|30|1800
2026-07-17|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:36:00|09:41:00|5|300
2026-07-17|Fri|FS0406|Sri Sai Teja Kolla|finance|09:29:00|09:59:00|30|1800
2026-07-17|Fri|FS0329|Sridhar Kumar S|erp|09:29:00|09:34:00|4|300
2026-07-17|Fri|FS0318|Suresh Babu S|testing|09:41:00|10:11:00|30|1800
2026-07-17|Fri|FS0085|Suryapriya Saravanan|dev|11:12:00|11:27:00|15|900
2026-07-17|Fri|FS0430|Syed Riyas Niyas|cyber|09:54:00|04:31:00|1116|67020
2026-07-17|Fri|FS0040|Veeravel Devaraj|ml|00:51:00|01:06:00|15|900
2026-07-17|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:49:00|10:19:00|30|1800
2026-07-17|Fri|FS0291|Vicky  Kumar|erp|09:25:00|09:30:00|5|300
2026-07-17|Fri|FS0325|Vijay Prakash A|testing|10:02:00|10:32:00|30|1800
2026-07-17|Fri|FS0239|VIJAY S R|testing|09:45:00|10:12:00|26|1620
2026-07-17|Fri|FS0353|Vishal Jayaraman|cyber|10:17:00|10:47:00|30|1800
2026-07-17|Fri|FS0341|Vishnu Priya|testing|09:45:00|10:01:00|15|960
2026-07-17|Fri|FS0219|Visvesvaran Kumaran|dev|09:30:00|09:42:00|11|720
2026-07-17|Fri|FS0294|Yamuna  M|dev|09:30:00|09:34:00|4|240
2026-07-17|Fri|FS0089|Yogeshwaran Chandrakasan|dev|09:45:00|09:50:00|5|300
2026-07-17|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:54:00|09:54:00|0|0
2026-07-17|Fri|FS0090|Yogeswaran Murugavel|cyber|09:35:00|10:05:00|30|1800
2026-07-17|Fri|FS0407|Yuvaraj Santhanam|erp|10:08:00|10:27:00|18|1140
2026-07-18|Sat|FS0243|DELLIBABU T|finance|09:16:00|09:46:00|30|1800
2026-07-18|Sat|FC0002|Dileep Thammana|finance|09:30:00|09:50:00|20|1200
2026-07-18|Sat|FS0237|JONES  KAPIL L|testing|09:45:00|09:54:00|8|540
2026-07-18|Sat|FST0013|Kalashree A|finance|09:45:00|10:10:00|24|1500
2026-07-18|Sat|FS0135|MAHESH T|cyber|03:14:00|03:44:00|30|1800
2026-07-18|Sat|FS0287|Nedunchezhiyan  M|dev|09:45:00|10:20:00|35|2100
2026-07-18|Sat|FS0213|Sastihari Seenivasan|dev|07:41:00|07:56:00|15|900
2026-07-18|Sat|FS0125|Shahul Hameed Abdul Samad|risk|02:32:00|02:32:00|0|0
2026-07-19|Sun|FS0287|Nedunchezhiyan  M|dev|10:23:00|11:36:00|72|4380
2026-07-19|Sun|FS0213|Sastihari Seenivasan|dev|11:08:00|11:23:00|15|900
2026-07-20|Mon|FS0189|Ajay Parameswaran|dev|09:30:00|10:01:00|31|1860
2026-07-20|Mon|FS0190|Anurag Virendrakumar|devops|09:21:00|09:36:00|15|900
2026-07-20|Mon|FS0021|ARJUN V|dev|08:50:00|09:05:00|15|900
2026-07-20|Mon|FS0342|Ashraf A|testing|09:45:00|09:52:00|7|420
2026-07-20|Mon|FS0426|Astin Ravi|cyber|09:32:00|10:02:00|30|1800
2026-07-20|Mon|FS0050|Avinash Pandian|cyber|09:22:00|09:52:00|30|1800
2026-07-20|Mon|FS0049|Balaji|dev|09:22:00|09:37:00|15|900
2026-07-20|Mon|FS0377|Daniel Raj N|it support|09:43:00|09:49:00|5|360
2026-07-20|Mon|FS0303|Deepeka|dev|09:27:00|09:42:00|15|900
2026-07-20|Mon|FS0277|Deepesh Raj B|dev|09:45:00|10:05:00|19|1200
2026-07-20|Mon|FS0243|DELLIBABU T|finance|09:41:00|10:11:00|30|1800
2026-07-20|Mon|FS0281|Dhanalakshmi S|dev|09:24:00|09:30:00|6|360
2026-07-20|Mon|FS0101|Dhiwan Mariappan|finance|08:13:00|08:43:00|30|1800
2026-07-20|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:57:00|10:57:00|0|0
2026-07-20|Mon|FS0311|Ganesh D|design|09:45:00|09:48:00|3|180
2026-07-20|Mon|FS0320|Gayathri K|data|09:29:00|09:44:00|15|900
2026-07-20|Mon|FS0319|Gokulakannan Duraisamy|ml|09:30:00|09:48:00|17|1080
2026-07-20|Mon|FS0073|Gokulakannan Selvam|design|07:52:00|08:55:00|63|3780
2026-07-20|Mon|FS0161|Haridha Muruganantham|erp|09:33:00|09:33:00|0|0
2026-07-20|Mon|FS0343|Hariharan Vijayakumar|erp|09:26:00|09:26:00|0|0
2026-07-20|Mon|FS0036|Jai Surya S|design|10:56:00|11:01:00|5|300
2026-07-20|Mon|FS0237|JONES  KAPIL L|testing|10:37:00|11:07:00|30|1800
2026-07-20|Mon|FST0013|Kalashree A|finance|09:30:00|09:53:00|23|1380
2026-07-20|Mon|FS0150|Karthikesan RajaRaman|dev|09:45:00|10:27:00|41|2520
2026-07-20|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|10:11:00|09:13:00|1382|82920
2026-07-20|Mon|FS0323|Kishore M|devops|09:45:00|10:18:00|32|1980
2026-07-20|Mon|FS0158|Kishore Theiveekan|dev|08:51:00|09:06:00|14|900
2026-07-20|Mon|FS0126|Lakshmi Prasanna U|admin|11:07:00|11:07:00|0|0
2026-07-20|Mon|FS0326|Mahasri Seenivasan|data|09:29:00|09:59:00|30|1800
2026-07-20|Mon|FS0390|Naveen Prasad Moorthy|dev|09:11:00|09:26:00|15|900
2026-07-20|Mon|FS0371|Navin D|dev|09:30:00|10:08:00|38|2280
2026-07-20|Mon|FS0287|Nedunchezhiyan  M|dev|08:48:00|07:26:00|1358|81480
2026-07-20|Mon|FS0321|Nithyanantham V|devops|09:33:00|09:48:00|15|900
2026-07-20|Mon|FS0306|PRAKASH K|dev|09:45:00|10:15:00|29|1800
2026-07-20|Mon|FS0209|Pravinabdulkalam Mathikannan|dev|10:09:00|10:24:00|15|900
2026-07-20|Mon|FST0011|Preethi Bernadath|finance|09:45:00|10:29:00|44|2640
2026-07-20|Mon|FS0424|Rajesh Pannirselvame|cyber|09:47:00|10:17:00|30|1800
2026-07-20|Mon|FS0400|Rexlin Felix S|erp|10:15:00|10:15:00|0|0
2026-07-20|Mon|FS0079|Sakthivel Mageshwaran|cyber|10:30:00|11:00:00|30|1800
2026-07-20|Mon|FS0438|Sangeetha Balasubramanian|testing|09:33:00|09:39:00|5|360
2026-07-20|Mon|FS0212|Santhosh Neelakandamoorthy|dev|09:49:00|10:04:00|15|900
2026-07-20|Mon|FS0442|Santhoshkumar Palanichamy|dev|10:04:00|10:19:00|15|900
2026-07-20|Mon|FS0334|Sarathi S S|testing|09:30:00|10:11:00|41|2460
2026-07-20|Mon|FS0031|Saravana Pandian S|design|09:45:00|10:25:00|39|2400
2026-07-20|Mon|FS0106|Saravanan Devendhiran|dev|09:53:00|10:08:00|15|900
2026-07-20|Mon|FS0148|Selvaprakash Balan|dev|09:21:00|09:36:00|15|900
2026-07-20|Mon|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|10:04:00|18|1140
2026-07-20|Mon|FS0215|Shanmugam Mohanasundaram|dev|10:17:00|10:22:00|5|300
2026-07-20|Mon|FS0022|Shashti Priyan shathiyavelu|design|09:16:00|09:16:00|0|0
2026-07-20|Mon|FS0391|Shashwath Pasupathi|erp|10:07:00|10:07:00|0|0
2026-07-20|Mon|FS0037|Sivashankaran P|dev|09:43:00|09:58:00|15|900
2026-07-20|Mon|FS0324|Sowmya Prabhu|testing|09:50:00|10:20:00|30|1800
2026-07-20|Mon|FS0406|Sri Sai Teja Kolla|finance|08:53:00|09:23:00|30|1800
2026-07-20|Mon|FS0329|Sridhar Kumar S|erp|09:04:00|09:09:00|5|300
2026-07-20|Mon|FS0428|Sriganth Chennan|cyber|09:45:00|10:05:00|20|1200
2026-07-20|Mon|FS0318|Suresh Babu S|testing|09:46:00|10:16:00|30|1800
2026-07-20|Mon|FS0085|Suryapriya Saravanan|dev|11:11:00|11:26:00|15|900
2026-07-20|Mon|FS0333|Theeban Babu S|dev|09:11:00|10:03:00|52|3120
2026-07-20|Mon|FS0040|Veeravel Devaraj|ml|09:30:00|10:09:00|39|2340
2026-07-20|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:14:00|10:44:00|30|1800
2026-07-20|Mon|FS0291|Vicky  Kumar|erp|09:26:00|09:26:00|0|0
2026-07-20|Mon|FS0302|Vignesh  Babu|cyber|08:55:00|09:25:00|30|1800
2026-07-20|Mon|FS0325|Vijay Prakash A|testing|09:58:00|10:28:00|30|1800
2026-07-20|Mon|FS0353|Vishal Jayaraman|cyber|09:30:00|09:43:00|13|780
2026-07-20|Mon|FS0035|Vivek I|cyber|09:30:00|09:51:00|20|1260
2026-07-20|Mon|FS0408|Yogeshwaran Govindaraj|erp|10:08:00|10:08:00|0|0
2026-07-20|Mon|FS0090|Yogeswaran Murugavel|cyber|09:16:00|09:46:00|30|1800
2026-07-20|Mon|FS0407|Yuvaraj Santhanam|erp|09:48:00|12:18:00|150|9000
2026-07-21|Tue|FS0189|Ajay Parameswaran|dev|00:59:00|00:14:00|1395|83700
2026-07-21|Tue|FS0190|Anurag Virendrakumar|devops|09:43:00|09:58:00|15|900
2026-07-21|Tue|FS0021|ARJUN V|dev|08:09:00|08:24:00|15|900
2026-07-21|Tue|FS0426|Astin Ravi|cyber|09:36:00|10:06:00|30|1800
2026-07-21|Tue|FS0050|Avinash Pandian|cyber|09:46:00|10:16:00|30|1800
2026-07-21|Tue|FS0049|Balaji|dev|10:22:00|10:37:00|15|900
2026-07-21|Tue|FS0015|Baskaran J|risk|06:05:00|06:05:00|0|0
2026-07-21|Tue|FS0188|Bharadwaj Kalathur Vadyar|finance|04:40:00|05:10:00|30|1800
2026-07-21|Tue|FS0193|Bharath Selvam|data|09:45:00|10:07:00|22|1320
2026-07-21|Tue|FS0377|Daniel Raj N|it support|09:52:00|10:02:00|10|600
2026-07-21|Tue|FS0303|Deepeka|dev|09:39:00|09:54:00|15|900
2026-07-21|Tue|FS0277|Deepesh Raj B|dev|11:14:00|11:29:00|15|900
2026-07-21|Tue|FS0243|DELLIBABU T|finance|09:28:00|09:58:00|30|1800
2026-07-21|Tue|FS0281|Dhanalakshmi S|dev|09:29:00|09:34:00|4|300
2026-07-21|Tue|FS0101|Dhiwan Mariappan|finance|07:44:00|08:14:00|30|1800
2026-07-21|Tue|FC0002|Dileep Thammana|finance|09:45:00|10:14:00|28|1740
2026-07-21|Tue|FS0046|Divya Priya Senthilkumaran|pm|09:30:00|09:57:00|27|1620
2026-07-21|Tue|FS0320|Gayathri K|data|09:08:00|09:23:00|15|900
2026-07-21|Tue|FS0319|Gokulakannan Duraisamy|ml|00:13:00|00:28:00|15|900
2026-07-21|Tue|FS0073|Gokulakannan Selvam|design|07:54:00|08:01:00|7|420
2026-07-21|Tue|FS0161|Haridha Muruganantham|erp|09:43:00|09:43:00|0|0
2026-07-21|Tue|FS0343|Hariharan Vijayakumar|erp|09:42:00|09:42:00|0|0
2026-07-21|Tue|FS0036|Jai Surya S|design|09:21:00|09:27:00|6|360
2026-07-21|Tue|FS0425|Jayachandran Iswaran|cyber|09:29:00|09:35:00|6|360
2026-07-21|Tue|FST0013|Kalashree A|finance|09:45:00|10:28:00|42|2580
2026-07-21|Tue|FS0289|Kantha  Kumar K|dev|08:56:00|09:00:00|4|240
2026-07-21|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:05:00|08:07:00|1381|82920
2026-07-21|Tue|FS0158|Kishore Theiveekan|dev|09:32:00|09:47:00|14|900
2026-07-21|Tue|FS0126|Lakshmi Prasanna U|admin|11:15:00|11:15:00|0|0
2026-07-21|Tue|FS0437|Lenci Manuela L|it support|10:10:00|10:15:00|4|300
2026-07-21|Tue|FS0339|Magesh Kumar|cyber|09:32:00|09:36:00|4|240
2026-07-21|Tue|FS0326|Mahasri Seenivasan|data|09:29:00|09:44:00|15|900
2026-07-21|Tue|FS0135|MAHESH T|cyber|09:45:00|09:47:00|1|120
2026-07-21|Tue|FS0297|Maruthan G|dev|00:41:00|00:56:00|15|900
2026-07-21|Tue|FS0063|Meenakshi Priya|finance|05:56:00|06:26:00|30|1800
2026-07-21|Tue|FS0427|Mukesh Muthusamy|cyber|09:30:00|10:00:00|30|1800
2026-07-21|Tue|FS0390|Naveen Prasad Moorthy|dev|09:12:00|09:17:00|4|300
2026-07-21|Tue|FS0287|Nedunchezhiyan  M|dev|09:46:00|08:35:00|1368|82140
2026-07-21|Tue|FS0321|Nithyanantham V|devops|09:10:00|09:25:00|15|900
2026-07-21|Tue|FS0209|Pravinabdulkalam Mathikannan|dev|09:52:00|10:07:00|15|900
2026-07-21|Tue|FST0011|Preethi Bernadath|finance|11:08:00|11:38:00|30|1800
2026-07-21|Tue|FS0424|Rajesh Pannirselvame|cyber|09:36:00|10:06:00|30|1800
2026-07-21|Tue|FS0398|Ranganathan C|erp|09:08:00|09:14:00|6|360
2026-07-21|Tue|FS0400|Rexlin Felix S|erp|09:30:00|09:48:00|17|1080
2026-07-21|Tue|FS0079|Sakthivel Mageshwaran|cyber|10:02:00|10:32:00|30|1800
2026-07-21|Tue|FS0438|Sangeetha Balasubramanian|testing|09:39:00|10:02:00|23|1380
2026-07-21|Tue|FS0409|Sanjay Boopathy M|finance|09:48:00|10:18:00|30|1800
2026-07-21|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:53:00|10:08:00|15|900
2026-07-21|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:36:00|09:51:00|15|900
2026-07-21|Tue|FS0334|Sarathi S S|testing|00:13:00|00:43:00|30|1800
2026-07-21|Tue|FS0031|Saravana Pandian S|design|10:40:00|10:40:00|0|0
2026-07-21|Tue|FS0106|Saravanan Devendhiran|dev|09:21:00|09:36:00|15|900
2026-07-21|Tue|FS0148|Selvaprakash Balan|dev|09:46:00|10:01:00|15|900
2026-07-21|Tue|FS0125|Shahul Hameed Abdul Samad|risk|01:14:00|01:14:00|0|0
2026-07-21|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:32:00|09:36:00|4|240
2026-07-21|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:59:00|09:59:00|0|0
2026-07-21|Tue|FS0391|Shashwath Pasupathi|erp|10:30:00|10:30:00|0|0
2026-07-21|Tue|FS0037|Sivashankaran P|dev|09:20:00|09:35:00|15|900
2026-07-21|Tue|FS0038|Sooriya Balaji Iyappan|dev|09:45:00|09:48:00|3|180
2026-07-21|Tue|FS0324|Sowmya Prabhu|testing|09:55:00|10:25:00|30|1800
2026-07-21|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:29:00|09:34:00|5|300
2026-07-21|Tue|FS0406|Sri Sai Teja Kolla|finance|08:47:00|09:17:00|30|1800
2026-07-21|Tue|FS0329|Sridhar Kumar S|erp|09:12:00|09:17:00|5|300
2026-07-21|Tue|FS0428|Sriganth Chennan|cyber|09:57:00|10:27:00|30|1800
2026-07-21|Tue|FS0318|Suresh Babu S|testing|09:34:00|10:04:00|30|1800
2026-07-21|Tue|FS0085|Suryapriya Saravanan|dev|11:14:00|11:29:00|15|900
2026-07-21|Tue|FS0430|Syed Riyas Niyas|cyber|09:30:00|09:38:00|8|480
2026-07-21|Tue|FS0333|Theeban Babu S|dev|09:13:00|09:19:00|6|360
2026-07-21|Tue|FS0040|Veeravel Devaraj|ml|00:55:00|01:10:00|15|900
2026-07-21|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:12:00|10:42:00|30|1800
2026-07-21|Tue|FS0291|Vicky  Kumar|erp|09:18:00|09:24:00|5|360
2026-07-21|Tue|FS0302|Vignesh  Babu|cyber|08:52:00|09:22:00|30|1800
2026-07-21|Tue|FS0325|Vijay Prakash A|testing|10:04:00|10:34:00|30|1800
2026-07-21|Tue|FS0353|Vishal Jayaraman|cyber|10:13:00|10:43:00|30|1800
2026-07-21|Tue|FS0035|Vivek I|cyber|09:30:00|09:56:00|25|1560
2026-07-21|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:56:00|09:56:00|0|0
2026-07-21|Tue|FS0090|Yogeswaran Murugavel|cyber|10:08:00|10:38:00|30|1800
2026-07-22|Wed|FS0414|Adam Gil Christ|it support|10:18:00|11:19:00|61|3660
2026-07-22|Wed|FS0190|Anurag Virendrakumar|devops|09:36:00|09:51:00|15|900
2026-07-22|Wed|FS0021|ARJUN V|dev|08:55:00|09:10:00|15|900
2026-07-22|Wed|FS0018|Asmath Nisha|finance|10:14:00|11:26:00|71|4320
2026-07-22|Wed|FS0426|Astin Ravi|cyber|09:23:00|09:53:00|30|1800
2026-07-22|Wed|FS0050|Avinash Pandian|cyber|10:27:00|10:57:00|30|1800
2026-07-22|Wed|FS0049|Balaji|dev|10:27:00|10:42:00|15|900
2026-07-22|Wed|FS0377|Daniel Raj N|it support|10:01:00|10:06:00|5|300
2026-07-22|Wed|FS0303|Deepeka|dev|09:30:00|10:11:00|41|2460
2026-07-22|Wed|FS0277|Deepesh Raj B|dev|11:06:00|11:21:00|15|900
2026-07-22|Wed|FS0243|DELLIBABU T|finance|09:33:00|10:03:00|30|1800
2026-07-22|Wed|FS0281|Dhanalakshmi S|dev|09:42:00|09:47:00|5|300
2026-07-22|Wed|FS0101|Dhiwan Mariappan|finance|07:57:00|08:27:00|30|1800
2026-07-22|Wed|FC0002|Dileep Thammana|finance|08:24:00|08:54:00|30|1800
2026-07-22|Wed|FS0046|Divya Priya Senthilkumaran|pm|11:11:00|11:11:00|0|0
2026-07-22|Wed|FS0320|Gayathri K|data|09:29:00|09:44:00|15|900
2026-07-22|Wed|FS0228|Geetha Karnan|risk|09:45:00|10:14:00|28|1740
2026-07-22|Wed|FS0073|Gokulakannan Selvam|design|07:44:00|07:51:00|6|420
2026-07-22|Wed|FS0161|Haridha Muruganantham|erp|09:42:00|09:42:00|0|0
2026-07-22|Wed|FS0343|Hariharan Vijayakumar|erp|09:43:00|09:43:00|0|0
2026-07-22|Wed|FS0036|Jai Surya S|design|08:48:00|08:57:00|8|540
2026-07-22|Wed|FS0425|Jayachandran Iswaran|cyber|09:55:00|09:21:00|1405|84360
2026-07-22|Wed|FS0237|JONES  KAPIL L|testing|11:01:00|11:31:00|30|1800
2026-07-22|Wed|FST0013|Kalashree A|finance|09:45:00|09:57:00|12|720
2026-07-22|Wed|FS0289|Kantha  Kumar K|dev|09:30:00|09:35:00|4|300
2026-07-22|Wed|FS0433|keerthivaasen.v@finstein.ai|cyber|08:57:00|08:06:00|1388|83340
2026-07-22|Wed|FS0323|Kishore M|devops|09:30:00|10:03:00|32|1980
2026-07-22|Wed|FS0158|Kishore Theiveekan|dev|10:04:00|10:20:00|15|960
2026-07-22|Wed|FS0126|Lakshmi Prasanna U|admin|10:54:00|10:54:00|0|0
2026-07-22|Wed|FS0437|Lenci Manuela L|it support|10:01:00|09:53:00|1431|85920
2026-07-22|Wed|FST0022|Madhumitha Chandrasekaran|finance|09:20:00|09:50:00|30|1800
2026-07-22|Wed|FS0339|Magesh Kumar|cyber|09:49:00|09:53:00|4|240
2026-07-22|Wed|FS0326|Mahasri Seenivasan|data|09:38:00|09:47:00|9|540
2026-07-22|Wed|FS0135|MAHESH T|cyber|00:16:00|00:46:00|30|1800
2026-07-22|Wed|FS0027|Manikadan P|design|10:25:00|12:19:00|114|6840
2026-07-22|Wed|FS0297|Maruthan G|dev|09:45:00|09:58:00|12|780
2026-07-22|Wed|FS0427|Mukesh Muthusamy|cyber|09:27:00|09:57:00|30|1800
2026-07-22|Wed|FS0390|Naveen Prasad Moorthy|dev|09:07:00|09:12:00|5|300
2026-07-22|Wed|FS0287|Nedunchezhiyan  M|dev|07:13:00|07:43:00|29|1800
2026-07-22|Wed|FS0321|Nithyanantham V|devops|09:33:00|09:48:00|15|900
2026-07-22|Wed|FS0306|PRAKASH K|dev|09:30:00|10:09:00|39|2340
2026-07-22|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|10:54:00|20:05:00|550|33060
2026-07-22|Wed|FST0011|Preethi Bernadath|finance|09:45:00|09:49:00|3|240
2026-07-22|Wed|FS0393|Raja Balaji A|erp|09:13:00|09:13:00|0|0
2026-07-22|Wed|FS0424|Rajesh Pannirselvame|cyber|09:23:00|09:53:00|30|1800
2026-07-22|Wed|FS0398|Ranganathan C|erp|09:29:00|09:34:00|5|300
2026-07-22|Wed|FS0400|Rexlin Felix S|erp|09:34:00|09:34:00|0|0
2026-07-22|Wed|FS0079|Sakthivel Mageshwaran|cyber|10:21:00|10:51:00|30|1800
2026-07-22|Wed|FS0438|Sangeetha Balasubramanian|testing|09:40:00|09:44:00|4|240
2026-07-22|Wed|FS0409|Sanjay Boopathy M|finance|10:19:00|09:18:00|1379|82740
2026-07-22|Wed|FS0212|Santhosh Neelakandamoorthy|dev|09:51:00|10:06:00|15|900
2026-07-22|Wed|FS0442|Santhoshkumar Palanichamy|dev|08:48:00|09:03:00|15|900
2026-07-22|Wed|FS0106|Saravanan Devendhiran|dev|09:09:00|09:24:00|15|900
2026-07-22|Wed|FS0231|Saritha Sekar|risk|09:45:00|10:00:00|15|900
2026-07-22|Wed|FS0148|Selvaprakash Balan|dev|09:37:00|09:52:00|15|900
2026-07-22|Wed|FS0125|Shahul Hameed Abdul Samad|risk|03:12:00|03:12:00|0|0
2026-07-22|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:34:00|09:38:00|4|240
2026-07-22|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:30:00|09:30:00|0|0
2026-07-22|Wed|FS0391|Shashwath Pasupathi|erp|10:00:00|10:00:00|0|0
2026-07-22|Wed|FS0037|Sivashankaran P|dev|09:12:00|09:27:00|15|900
2026-07-22|Wed|FS0038|Sooriya Balaji Iyappan|dev|09:30:00|09:39:00|8|540
2026-07-22|Wed|FS0324|Sowmya Prabhu|testing|09:55:00|10:25:00|30|1800
2026-07-22|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:22:00|09:28:00|5|360
2026-07-22|Wed|FS0406|Sri Sai Teja Kolla|finance|08:51:00|09:21:00|30|1800
2026-07-22|Wed|FS0329|Sridhar Kumar S|erp|08:59:00|00:00:00|900|54060
2026-07-22|Wed|FS0428|Sriganth Chennan|cyber|10:10:00|10:40:00|30|1800
2026-07-22|Wed|FS0318|Suresh Babu S|testing|09:43:00|10:13:00|30|1800
2026-07-22|Wed|FS0085|Suryapriya Saravanan|dev|09:30:00|10:13:00|43|2580
2026-07-22|Wed|FS0430|Syed Riyas Niyas|cyber|10:39:00|03:28:00|1009|60540
2026-07-22|Wed|FS0333|Theeban Babu S|dev|08:52:00|08:58:00|5|360
2026-07-22|Wed|FS0040|Veeravel Devaraj|ml|00:15:00|00:30:00|15|900
2026-07-22|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:08:00|10:38:00|30|1800
2026-07-22|Wed|FS0291|Vicky  Kumar|erp|09:33:00|09:37:00|4|240
2026-07-22|Wed|FS0302|Vignesh  Babu|cyber|08:52:00|09:22:00|30|1800
2026-07-22|Wed|FS0325|Vijay Prakash A|testing|10:08:00|10:38:00|30|1800
2026-07-22|Wed|FS0353|Vishal Jayaraman|cyber|10:09:00|10:39:00|30|1800
2026-07-22|Wed|FS0035|Vivek I|cyber|09:30:00|09:52:00|22|1320
2026-07-22|Wed|FS0408|Yogeshwaran Govindaraj|erp|10:00:00|10:00:00|0|0
2026-07-22|Wed|FS0090|Yogeswaran Murugavel|cyber|10:58:00|11:28:00|30|1800
2026-07-22|Wed|FS0407|Yuvaraj Santhanam|erp|09:36:00|09:40:00|4|240
2026-07-23|Thu|FS0439|Abinesh Nagarajan|devops|09:30:00|09:45:00|15|900
2026-07-23|Thu|FS0414|Adam Gil Christ|it support|10:27:00|10:34:00|7|420
2026-07-23|Thu|FS0190|Anurag Virendrakumar|devops|09:31:00|09:46:00|15|900
2026-07-23|Thu|FS0021|ARJUN V|dev|07:38:00|07:53:00|15|900
2026-07-23|Thu|FS0342|Ashraf A|testing|09:45:00|09:54:00|8|540
2026-07-23|Thu|FS0426|Astin Ravi|cyber|09:00:00|09:30:00|30|1800
2026-07-23|Thu|FS0050|Avinash Pandian|cyber|09:40:00|10:10:00|30|1800
2026-07-23|Thu|FS0169|Baba Nazeer basha|finance|09:45:00|10:11:00|25|1560
2026-07-23|Thu|FS0049|Balaji|dev|10:16:00|10:31:00|15|900
2026-07-23|Thu|FS0377|Daniel Raj N|it support|09:40:00|09:45:00|4|300
2026-07-23|Thu|FS0303|Deepeka|dev|09:43:00|09:58:00|15|900
2026-07-23|Thu|FS0277|Deepesh Raj B|dev|09:45:00|10:18:00|33|1980
2026-07-23|Thu|FS0243|DELLIBABU T|finance|09:48:00|10:18:00|30|1800
2026-07-23|Thu|FS0281|Dhanalakshmi S|dev|09:25:00|09:31:00|5|360
2026-07-23|Thu|FS0101|Dhiwan Mariappan|finance|07:51:00|08:21:00|30|1800
2026-07-23|Thu|FC0002|Dileep Thammana|finance|10:44:00|11:14:00|30|1800
2026-07-23|Thu|FS0046|Divya Priya Senthilkumaran|pm|09:25:00|09:25:00|0|0
2026-07-23|Thu|FS0228|Geetha Karnan|risk|09:45:00|09:50:00|4|300
2026-07-23|Thu|FS0073|Gokulakannan Selvam|design|07:54:00|08:02:00|8|480
2026-07-23|Thu|FS0161|Haridha Muruganantham|erp|09:45:00|09:48:00|2|180
2026-07-23|Thu|FS0343|Hariharan Vijayakumar|erp|09:44:00|09:44:00|0|0
2026-07-23|Thu|FS0036|Jai Surya S|design|09:45:00|10:02:00|17|1020
2026-07-23|Thu|FS0425|Jayachandran Iswaran|cyber|09:30:00|10:06:00|35|2160
2026-07-23|Thu|FST0013|Kalashree A|finance|10:59:00|06:13:00|1154|69240
2026-07-23|Thu|FS0289|Kantha  Kumar K|dev|08:51:00|08:55:00|4|240
2026-07-23|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|08:20:00|08:29:00|8|540
2026-07-23|Thu|FS0158|Kishore Theiveekan|dev|09:45:00|10:22:00|36|2220
2026-07-23|Thu|FS0126|Lakshmi Prasanna U|admin|10:21:00|10:21:00|0|0
2026-07-23|Thu|FST0022|Madhumitha Chandrasekaran|finance|10:17:00|10:47:00|30|1800
2026-07-23|Thu|FS0339|Magesh Kumar|cyber|09:45:00|10:00:00|14|900
2026-07-23|Thu|FS0326|Mahasri Seenivasan|data|09:33:00|09:39:00|5|360
2026-07-23|Thu|FS0135|MAHESH T|cyber|02:58:00|03:28:00|30|1800
2026-07-23|Thu|FS0027|Manikadan P|design|10:45:00|10:50:00|4|300
2026-07-23|Thu|FS0076|Meena Rajendran|testing|09:30:00|09:40:00|9|600
2026-07-23|Thu|FS0427|Mukesh Muthusamy|cyber|09:30:00|10:00:00|30|1800
2026-07-23|Thu|FS0390|Naveen Prasad Moorthy|dev|09:04:00|09:09:00|4|300
2026-07-23|Thu|FS0287|Nedunchezhiyan  M|dev|09:45:00|10:22:00|36|2220
2026-07-23|Thu|FS0321|Nithyanantham V|devops|09:31:00|09:46:00|15|900
2026-07-23|Thu|FS0306|PRAKASH K|dev|09:30:00|10:14:00|44|2640
2026-07-23|Thu|FS0209|Pravinabdulkalam Mathikannan|dev|10:38:00|10:53:00|15|900
2026-07-23|Thu|FST0011|Preethi Bernadath|finance|11:05:00|11:35:00|30|1800
2026-07-23|Thu|FS0144|Ragul Priyan Murugan|dev|11:08:00|11:23:00|15|900
2026-07-23|Thu|FS0393|Raja Balaji A|erp|08:28:00|08:28:00|0|0
2026-07-23|Thu|FS0424|Rajesh Pannirselvame|cyber|09:00:00|09:30:00|30|1800
2026-07-23|Thu|FS0398|Ranganathan C|erp|09:25:00|09:30:00|4|300
2026-07-23|Thu|FS0079|Sakthivel Mageshwaran|cyber|10:02:00|10:32:00|30|1800
2026-07-23|Thu|FS0438|Sangeetha Balasubramanian|testing|09:36:00|09:40:00|4|240
2026-07-23|Thu|FS0409|Sanjay Boopathy M|finance|10:28:00|08:32:00|1324|79440
2026-07-23|Thu|FS0212|Santhosh Neelakandamoorthy|dev|09:25:00|09:40:00|15|900
2026-07-23|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:31:00|09:46:00|15|900
2026-07-23|Thu|FS0031|Saravana Pandian S|design|10:45:00|10:45:00|0|0
2026-07-23|Thu|FS0106|Saravanan Devendhiran|dev|09:25:00|09:40:00|15|900
2026-07-23|Thu|FS0148|Selvaprakash Balan|dev|09:45:00|10:22:00|36|2220
2026-07-23|Thu|FS0125|Shahul Hameed Abdul Samad|risk|09:30:00|10:14:00|44|2640
2026-07-23|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:30:00|09:45:00|14|900
2026-07-23|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:25:00|09:25:00|0|0
2026-07-23|Thu|FS0391|Shashwath Pasupathi|erp|09:49:00|09:49:00|0|0
2026-07-23|Thu|FS0037|Sivashankaran P|dev|09:30:00|10:04:00|33|2040
2026-07-23|Thu|FS0038|Sooriya Balaji Iyappan|dev|09:13:00|09:28:00|15|900
2026-07-23|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:28:00|09:36:00|8|480
2026-07-23|Thu|FS0406|Sri Sai Teja Kolla|finance|08:43:00|09:13:00|30|1800
2026-07-23|Thu|FS0329|Sridhar Kumar S|erp|09:15:00|09:20:00|4|300
2026-07-23|Thu|FS0428|Sriganth Chennan|cyber|10:00:00|10:30:00|30|1800
2026-07-23|Thu|FS0318|Suresh Babu S|testing|10:05:00|10:35:00|30|1800
2026-07-23|Thu|FS0085|Suryapriya Saravanan|dev|11:05:00|11:20:00|15|900
2026-07-23|Thu|FS0430|Syed Riyas Niyas|cyber|10:32:00|02:47:00|974|58500
2026-07-23|Thu|FS0333|Theeban Babu S|dev|09:04:00|09:10:00|5|360
2026-07-23|Thu|FS0040|Veeravel Devaraj|ml|07:23:00|07:38:00|15|900
2026-07-23|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:07:00|10:37:00|30|1800
2026-07-23|Thu|FS0291|Vicky  Kumar|erp|09:17:00|09:23:00|5|360
2026-07-23|Thu|FS0302|Vignesh  Babu|cyber|08:49:00|09:19:00|30|1800
2026-07-23|Thu|FS0325|Vijay Prakash A|testing|10:06:00|10:36:00|30|1800
2026-07-23|Thu|FS0353|Vishal Jayaraman|cyber|09:45:00|10:27:00|41|2520
2026-07-23|Thu|FS0035|Vivek I|cyber|09:30:00|09:47:00|16|1020
2026-07-23|Thu|FS0089|Yogeshwaran Chandrakasan|dev|09:30:00|09:54:00|23|1440
2026-07-23|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:28:00|09:28:00|0|0
2026-07-23|Thu|FS0090|Yogeswaran Murugavel|cyber|11:05:00|11:35:00|30|1800
2026-07-24|Fri|FS0414|Adam Gil Christ|it support|10:15:00|10:36:00|21|1260
2026-07-24|Fri|FS0190|Anurag Virendrakumar|devops|09:46:00|10:01:00|15|900
2026-07-24|Fri|FS0018|Asmath Nisha|finance|10:02:00|10:12:00|9|600
2026-07-24|Fri|FS0426|Astin Ravi|cyber|09:38:00|10:08:00|30|1800
2026-07-24|Fri|FS0050|Avinash Pandian|cyber|10:30:00|11:00:00|30|1800
2026-07-24|Fri|FS0169|Baba Nazeer basha|finance|00:14:00|00:44:00|30|1800
2026-07-24|Fri|FS0049|Balaji|dev|10:30:00|10:45:00|15|900
2026-07-24|Fri|FS0194|Bharathi Arjunan|dev|09:44:00|10:12:00|28|1680
2026-07-24|Fri|FS0377|Daniel Raj N|it support|09:39:00|10:12:00|33|1980
2026-07-24|Fri|FS0195|David Mariyajebamalai|dev|09:30:00|09:49:00|19|1140
2026-07-24|Fri|FS0303|Deepeka|dev|09:18:00|09:33:00|15|900
2026-07-24|Fri|FS0277|Deepesh Raj B|dev|10:13:00|10:28:00|15|900
2026-07-24|Fri|FS0243|DELLIBABU T|finance|09:27:00|09:57:00|30|1800
2026-07-24|Fri|FS0281|Dhanalakshmi S|dev|09:22:00|09:26:00|4|240
2026-07-24|Fri|FC0002|Dileep Thammana|finance|09:30:00|09:38:00|8|480
2026-07-24|Fri|FS0046|Divya Priya Senthilkumaran|pm|09:26:00|09:26:00|0|0
2026-07-24|Fri|FS0320|Gayathri K|data|09:27:00|09:42:00|15|900
2026-07-24|Fri|FS0319|Gokulakannan Duraisamy|ml|09:45:00|09:57:00|12|720
2026-07-24|Fri|FS0073|Gokulakannan Selvam|design|07:51:00|07:57:00|6|360
2026-07-24|Fri|FS0161|Haridha Muruganantham|erp|09:46:00|09:46:00|0|0
2026-07-24|Fri|FS0343|Hariharan Vijayakumar|erp|09:43:00|09:43:00|0|0
2026-07-24|Fri|FS0036|Jai Surya S|design|09:41:00|10:12:00|30|1860
2026-07-24|Fri|FS0425|Jayachandran Iswaran|cyber|09:30:00|10:11:00|41|2460
2026-07-24|Fri|FST0013|Kalashree A|finance|11:21:00|06:42:00|1160|69660
2026-07-24|Fri|FS0289|Kantha  Kumar K|dev|08:53:00|08:59:00|5|360
2026-07-24|Fri|FS0150|Karthikesan RajaRaman|dev|09:30:00|10:07:00|36|2220
2026-07-24|Fri|FS0433|keerthivaasen.v@finstein.ai|cyber|09:54:00|08:58:00|1384|83040
2026-07-24|Fri|FS0158|Kishore Theiveekan|dev|09:33:00|09:47:00|14|840
2026-07-24|Fri|FS0126|Lakshmi Prasanna U|admin|10:45:00|10:45:00|0|0
2026-07-24|Fri|FS0437|Lenci Manuela L|it support|09:56:00|12:21:00|145|8700
2026-07-24|Fri|FST0022|Madhumitha Chandrasekaran|finance|09:20:00|09:50:00|30|1800
2026-07-24|Fri|FS0339|Magesh Kumar|cyber|09:51:00|10:32:00|40|2460
2026-07-24|Fri|FS0326|Mahasri Seenivasan|data|09:33:00|10:34:00|60|3660
2026-07-24|Fri|FS0135|MAHESH T|cyber|09:45:00|10:05:00|19|1200
2026-07-24|Fri|FS0027|Manikadan P|design|11:02:00|11:53:00|50|3060
2026-07-24|Fri|FS0024|Manikandan Baskaran|cyber|11:13:00|11:43:00|30|1800
2026-07-24|Fri|FS0390|Naveen Prasad Moorthy|dev|09:00:00|09:04:00|4|240
2026-07-24|Fri|FS0287|Nedunchezhiyan  M|dev|07:50:00|08:44:00|54|3240
2026-07-24|Fri|FS0321|Nithyanantham V|devops|09:13:00|09:28:00|15|900
2026-07-24|Fri|FS0306|PRAKASH K|dev|10:48:00|11:03:00|15|900
2026-07-24|Fri|FS0209|Pravinabdulkalam Mathikannan|dev|11:22:00|19:55:00|513|30780
2026-07-24|Fri|FST0011|Preethi Bernadath|finance|11:27:00|11:57:00|30|1800
2026-07-24|Fri|FS0144|Ragul Priyan Murugan|dev|10:48:00|11:03:00|15|900
2026-07-24|Fri|FS0393|Raja Balaji A|erp|08:42:00|08:42:00|0|0
2026-07-24|Fri|FS0424|Rajesh Pannirselvame|cyber|09:20:00|09:50:00|30|1800
2026-07-24|Fri|FS0398|Ranganathan C|erp|09:39:00|01:10:00|930|55860
2026-07-24|Fri|FS0400|Rexlin Felix S|erp|09:43:00|09:43:00|0|0
2026-07-24|Fri|FS0023|Sakthivel M|erp|09:30:00|09:31:00|1|60
2026-07-24|Fri|FS0079|Sakthivel Mageshwaran|cyber|10:36:00|11:06:00|30|1800
2026-07-24|Fri|FS0438|Sangeetha Balasubramanian|testing|09:41:00|10:33:00|51|3120
2026-07-24|Fri|FS0409|Sanjay Boopathy M|finance|10:17:00|10:47:00|30|1800
2026-07-24|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:29:00|09:44:00|15|900
2026-07-24|Fri|FS0442|Santhoshkumar Palanichamy|dev|09:37:00|09:52:00|15|900
2026-07-24|Fri|FS0334|Sarathi S S|testing|10:57:00|11:27:00|30|1800
2026-07-24|Fri|FS0106|Saravanan Devendhiran|dev|10:26:00|10:41:00|15|900
2026-07-24|Fri|FS0231|Saritha Sekar|risk|10:40:00|10:40:00|0|0
2026-07-24|Fri|FS0148|Selvaprakash Balan|dev|09:07:00|09:22:00|15|900
2026-07-24|Fri|FS0125|Shahul Hameed Abdul Samad|risk|02:27:00|02:27:00|0|0
2026-07-24|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:49:00|09:49:00|0|0
2026-07-24|Fri|FS0391|Shashwath Pasupathi|erp|09:56:00|09:56:00|0|0
2026-07-24|Fri|FS0037|Sivashankaran P|dev|09:42:00|09:57:00|15|900
2026-07-24|Fri|FS0038|Sooriya Balaji Iyappan|dev|09:06:00|09:21:00|15|900
2026-07-24|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:27:00|09:33:00|6|360
2026-07-24|Fri|FS0406|Sri Sai Teja Kolla|finance|08:47:00|09:17:00|30|1800
2026-07-24|Fri|FS0329|Sridhar Kumar S|erp|09:12:00|09:17:00|5|300
2026-07-24|Fri|FS0428|Sriganth Chennan|cyber|09:58:00|10:28:00|30|1800
2026-07-24|Fri|FS0085|Suryapriya Saravanan|dev|10:45:00|11:00:00|15|900
2026-07-24|Fri|FS0430|Syed Riyas Niyas|cyber|10:05:00|12:33:00|147|8880
2026-07-24|Fri|FS0333|Theeban Babu S|dev|09:00:00|09:06:00|5|360
2026-07-24|Fri|FS0040|Veeravel Devaraj|ml|08:24:00|08:39:00|15|900
2026-07-24|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:05:00|10:35:00|30|1800
2026-07-24|Fri|FS0291|Vicky  Kumar|erp|09:41:00|09:41:00|0|0
2026-07-24|Fri|FS0302|Vignesh  Babu|cyber|08:51:00|09:21:00|30|1800
2026-07-24|Fri|FS0325|Vijay Prakash A|testing|10:09:00|10:39:00|30|1800
2026-07-24|Fri|FS0353|Vishal Jayaraman|cyber|10:16:00|10:46:00|30|1800
2026-07-24|Fri|FS0035|Vivek I|cyber|09:30:00|09:39:00|8|540
2026-07-24|Fri|FS0408|Yogeshwaran Govindaraj|erp|10:01:00|10:01:00|0|0
2026-07-24|Fri|FS0090|Yogeswaran Murugavel|cyber|10:13:00|10:43:00|30|1800
2026-07-24|Fri|FS0407|Yuvaraj Santhanam|erp|09:35:00|11:31:00|115|6960
2026-07-25|Sat|FS0414|Adam Gil Christ|it support|10:03:00|10:38:00|34|2100
2026-07-25|Sat|FS0189|Ajay Parameswaran|dev|09:45:00|10:15:00|29|1800
2026-07-25|Sat|FS0190|Anurag Virendrakumar|devops|09:37:00|09:52:00|15|900
2026-07-25|Sat|FS0018|Asmath Nisha|finance|10:11:00|10:24:00|12|780
2026-07-25|Sat|FS0426|Astin Ravi|cyber|09:21:00|09:51:00|30|1800
2026-07-25|Sat|FS0050|Avinash Pandian|cyber|10:13:00|10:43:00|30|1800
2026-07-25|Sat|FS0049|Balaji|dev|10:13:00|10:28:00|15|900
2026-07-25|Sat|FS0193|Bharath Selvam|data|09:45:00|10:15:00|29|1800
2026-07-25|Sat|FS0194|Bharathi Arjunan|dev|09:45:00|10:31:00|45|2760
2026-07-25|Sat|FS0195|David Mariyajebamalai|dev|11:04:00|11:09:00|4|300
2026-07-25|Sat|FS0277|Deepesh Raj B|dev|11:11:00|11:26:00|15|900
2026-07-25|Sat|FS0243|DELLIBABU T|finance|09:29:00|09:59:00|30|1800
2026-07-25|Sat|FS0281|Dhanalakshmi S|dev|09:30:00|09:35:00|5|300
2026-07-25|Sat|FC0002|Dileep Thammana|finance|09:45:00|09:51:00|6|360
2026-07-25|Sat|FS0046|Divya Priya Senthilkumaran|pm|10:29:00|10:29:00|0|0
2026-07-25|Sat|FS0311|Ganesh D|design|09:30:00|10:09:00|38|2340
2026-07-25|Sat|FS0320|Gayathri K|data|09:27:00|09:42:00|15|900
2026-07-25|Sat|FS0319|Gokulakannan Duraisamy|ml|09:45:00|09:58:00|12|780
2026-07-25|Sat|FS0073|Gokulakannan Selvam|design|07:57:00|08:06:00|8|540
2026-07-25|Sat|FS0161|Haridha Muruganantham|erp|09:39:00|09:39:00|0|0
2026-07-25|Sat|FS0343|Hariharan Vijayakumar|erp|09:30:00|09:30:00|0|0
2026-07-25|Sat|FS0425|Jayachandran Iswaran|cyber|09:34:00|09:39:00|5|300
2026-07-25|Sat|FS0237|JONES  KAPIL L|testing|09:45:00|09:54:00|9|540
2026-07-25|Sat|FS0289|Kantha  Kumar K|dev|09:11:00|13:56:00|285|17100
2026-07-25|Sat|FS0433|keerthivaasen.v@finstein.ai|cyber|09:53:00|09:03:00|1390|83400
2026-07-25|Sat|FS0323|Kishore M|devops|09:30:00|10:08:00|37|2280
2026-07-25|Sat|FS0158|Kishore Theiveekan|dev|09:05:00|09:19:00|14|840
2026-07-25|Sat|FS0437|Lenci Manuela L|it support|10:02:00|10:02:00|0|0
2026-07-25|Sat|FST0022|Madhumitha Chandrasekaran|finance|09:41:00|10:11:00|30|1800
2026-07-25|Sat|FS0339|Magesh Kumar|cyber|09:30:00|10:59:00|89|5340
2026-07-25|Sat|FS0326|Mahasri Seenivasan|data|09:35:00|10:47:00|71|4320
2026-07-25|Sat|FS0135|MAHESH T|cyber|00:57:00|01:27:00|30|1800
2026-07-25|Sat|FS0024|Manikandan Baskaran|cyber|09:58:00|10:28:00|30|1800
2026-07-25|Sat|FS0427|Mukesh Muthusamy|cyber|09:30:00|10:11:00|40|2460
2026-07-25|Sat|FS0390|Naveen Prasad Moorthy|dev|08:23:00|08:29:00|5|360
2026-07-25|Sat|FS0321|Nithyanantham V|devops|09:05:00|09:20:00|15|900
2026-07-25|Sat|FS0306|PRAKASH K|dev|10:26:00|10:41:00|15|900
2026-07-25|Sat|FS0322|Praveenkumar Saminathan|devops|09:45:00|10:17:00|32|1920
2026-07-25|Sat|FS0209|Pravinabdulkalam Mathikannan|dev|10:00:00|16:38:00|398|23880
2026-07-25|Sat|FS0393|Raja Balaji A|erp|08:39:00|08:39:00|0|0
2026-07-25|Sat|FS0424|Rajesh Pannirselvame|cyber|08:02:00|08:32:00|30|1800
2026-07-25|Sat|FS0398|Ranganathan C|erp|09:43:00|07:09:00|1285|77160
2026-07-25|Sat|FS0400|Rexlin Felix S|erp|09:44:00|09:44:00|0|0
2026-07-25|Sat|FS0023|Sakthivel M|erp|09:30:00|10:13:00|43|2580
2026-07-25|Sat|FS0079|Sakthivel Mageshwaran|cyber|09:51:00|10:21:00|30|1800
2026-07-25|Sat|FS0409|Sanjay Boopathy M|finance|10:02:00|10:32:00|30|1800
2026-07-25|Sat|FS0212|Santhosh Neelakandamoorthy|dev|10:07:00|10:22:00|15|900
2026-07-25|Sat|FS0442|Santhoshkumar Palanichamy|dev|09:51:00|10:06:00|15|900
2026-07-25|Sat|FS0334|Sarathi S S|testing|09:45:00|09:56:00|10|660
2026-07-25|Sat|FS0031|Saravana Pandian S|design|10:46:00|10:46:00|0|0
2026-07-25|Sat|FS0106|Saravanan Devendhiran|dev|10:27:00|10:42:00|15|900
2026-07-25|Sat|FS0148|Selvaprakash Balan|dev|09:35:00|09:50:00|15|900
2026-07-25|Sat|FS0125|Shahul Hameed Abdul Samad|risk|03:35:00|03:35:00|0|0
2026-07-25|Sat|FS0215|Shanmugam Mohanasundaram|dev|10:02:00|10:07:00|4|300
2026-07-25|Sat|FS0391|Shashwath Pasupathi|erp|10:07:00|10:07:00|0|0
2026-07-25|Sat|FS0324|Sowmya Prabhu|testing|09:43:00|10:13:00|30|1800
2026-07-25|Sat|FS0423|Sri Cibi Sivakumar|cyber|09:33:00|10:45:00|72|4320
2026-07-25|Sat|FS0406|Sri Sai Teja Kolla|finance|08:56:00|09:26:00|30|1800
2026-07-25|Sat|FS0329|Sridhar Kumar S|erp|09:13:00|10:44:00|91|5460
2026-07-25|Sat|FS0428|Sriganth Chennan|cyber|10:03:00|10:33:00|30|1800
2026-07-25|Sat|FS0318|Suresh Babu S|testing|09:51:00|10:21:00|30|1800
2026-07-25|Sat|FS0430|Syed Riyas Niyas|cyber|10:10:00|00:50:00|879|52800
2026-07-25|Sat|FS0333|Theeban Babu S|dev|08:19:00|08:25:00|5|360
2026-07-25|Sat|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:03:00|10:33:00|30|1800
2026-07-25|Sat|FS0291|Vicky  Kumar|erp|09:32:00|09:32:00|0|0
2026-07-25|Sat|FS0302|Vignesh  Babu|cyber|08:08:00|08:38:00|30|1800
2026-07-25|Sat|FS0325|Vijay Prakash A|testing|10:05:00|10:35:00|30|1800
2026-07-25|Sat|FS0353|Vishal Jayaraman|cyber|09:30:00|10:07:00|37|2220
2026-07-25|Sat|FS0035|Vivek I|cyber|09:30:00|09:39:00|9|540
2026-07-25|Sat|FS0089|Yogeshwaran Chandrakasan|dev|09:30:00|09:32:00|1|120
2026-07-25|Sat|FS0408|Yogeshwaran Govindaraj|erp|09:33:00|09:33:00|0|0
2026-07-25|Sat|FS0090|Yogeswaran Murugavel|cyber|09:44:00|10:14:00|30|1800
2026-07-25|Sat|FS0407|Yuvaraj Santhanam|erp|09:25:00|10:44:00|78|4740
2026-07-27|Mon|FS0189|Ajay Parameswaran|dev|09:45:00|10:08:00|23|1380
2026-07-27|Mon|FS0021|ARJUN V|dev|07:29:00|07:44:00|15|900
2026-07-27|Mon|FS0342|Ashraf A|testing|09:30:00|09:31:00|0|60
2026-07-27|Mon|FS0018|Asmath Nisha|finance|09:53:00|10:08:00|14|900
2026-07-27|Mon|FS0426|Astin Ravi|cyber|09:37:00|10:07:00|30|1800
2026-07-27|Mon|FS0050|Avinash Pandian|cyber|09:28:00|09:58:00|30|1800
2026-07-27|Mon|FS0049|Balaji|dev|09:28:00|09:43:00|15|900
2026-07-27|Mon|FS0194|Bharathi Arjunan|dev|09:27:00|10:06:00|39|2340
2026-07-27|Mon|FS0377|Daniel Raj N|it support|09:58:00|09:58:00|0|0
2026-07-27|Mon|FS0195|David Mariyajebamalai|dev|11:21:00|00:00:00|758|45540
2026-07-27|Mon|FS0277|Deepesh Raj B|dev|10:40:00|10:55:00|15|900
2026-07-27|Mon|FS0243|DELLIBABU T|finance|09:33:00|10:03:00|30|1800
2026-07-27|Mon|FS0281|Dhanalakshmi S|dev|09:30:00|09:38:00|8|480
2026-07-27|Mon|FS0101|Dhiwan Mariappan|finance|07:43:00|08:13:00|30|1800
2026-07-27|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:05:00|10:05:00|0|0
2026-07-27|Mon|FS0073|Gokulakannan Selvam|design|07:56:00|08:08:00|12|720
2026-07-27|Mon|FS0161|Haridha Muruganantham|erp|09:43:00|09:43:00|0|0
2026-07-27|Mon|FS0343|Hariharan Vijayakumar|erp|09:32:00|09:32:00|0|0
2026-07-27|Mon|FS0036|Jai Surya S|design|09:57:00|10:07:00|9|600
2026-07-27|Mon|FS0425|Jayachandran Iswaran|cyber|09:51:00|10:07:00|15|960
2026-07-27|Mon|FS0237|JONES  KAPIL L|testing|09:30:00|09:41:00|10|660
2026-07-27|Mon|FST0013|Kalashree A|finance|09:45:00|10:17:00|32|1920
2026-07-27|Mon|FS0289|Kantha  Kumar K|dev|09:02:00|09:17:00|15|900
2026-07-27|Mon|FS0150|Karthikesan RajaRaman|dev|09:45:00|09:51:00|6|360
2026-07-27|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|09:27:00|08:31:00|1383|83040
2026-07-27|Mon|FS0158|Kishore Theiveekan|dev|08:48:00|09:05:00|17|1020
2026-07-27|Mon|FS0126|Lakshmi Prasanna U|admin|10:25:00|10:25:00|0|0
2026-07-27|Mon|FS0437|Lenci Manuela L|it support|10:07:00|09:35:00|1407|84480
2026-07-27|Mon|FST0022|Madhumitha Chandrasekaran|finance|10:03:00|10:33:00|30|1800
2026-07-27|Mon|FS0339|Magesh Kumar|cyber|09:36:00|10:23:00|47|2820
2026-07-27|Mon|FS0326|Mahasri Seenivasan|data|09:37:00|10:07:00|29|1800
2026-07-27|Mon|FS0135|MAHESH T|cyber|09:45:00|09:49:00|4|240
2026-07-27|Mon|FS0027|Manikadan P|design|10:34:00|10:59:00|25|1500
2026-07-27|Mon|FS0297|Maruthan G|dev|09:45:00|10:25:00|40|2400
2026-07-27|Mon|FS0427|Mukesh Muthusamy|cyber|09:30:00|09:47:00|17|1020
2026-07-27|Mon|FS0298|Nantha Guru|dev|09:30:00|10:07:00|37|2220
2026-07-27|Mon|FS0390|Naveen Prasad Moorthy|dev|09:08:00|09:23:00|15|900
2026-07-27|Mon|FS0287|Nedunchezhiyan  M|dev|06:42:00|06:57:00|15|900
2026-07-27|Mon|FS0321|Nithyanantham V|devops|09:12:00|09:27:00|15|900
2026-07-27|Mon|FS0306|PRAKASH K|dev|09:30:00|10:01:00|30|1860
2026-07-27|Mon|FST0011|Preethi Bernadath|finance|11:29:00|11:59:00|30|1800
2026-07-27|Mon|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:16:00|30|1860
2026-07-27|Mon|FS0424|Rajesh Pannirselvame|cyber|09:51:00|10:21:00|30|1800
2026-07-27|Mon|FS0398|Ranganathan C|erp|09:23:00|04:05:00|1121|67320
2026-07-27|Mon|FS0400|Rexlin Felix S|erp|09:38:00|09:38:00|0|0
2026-07-27|Mon|FS0023|Sakthivel M|erp|10:35:00|10:35:00|0|0
2026-07-27|Mon|FS0079|Sakthivel Mageshwaran|cyber|11:26:00|11:56:00|30|1800
2026-07-27|Mon|FS0409|Sanjay Boopathy M|finance|10:05:00|10:35:00|30|1800
2026-07-27|Mon|FS0212|Santhosh Neelakandamoorthy|dev|10:10:00|10:25:00|15|900
2026-07-27|Mon|FS0442|Santhoshkumar Palanichamy|dev|09:27:00|09:42:00|15|900
2026-07-27|Mon|FS0031|Saravana Pandian S|design|10:50:00|10:50:00|0|0
2026-07-27|Mon|FS0106|Saravanan Devendhiran|dev|09:13:00|09:28:00|15|900
2026-07-27|Mon|FS0148|Selvaprakash Balan|dev|09:43:00|09:58:00|15|900
2026-07-27|Mon|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|10:25:00|39|2400
2026-07-27|Mon|FS0215|Shanmugam Mohanasundaram|dev|10:53:00|11:08:00|15|900
2026-07-27|Mon|FS0022|Shashti Priyan shathiyavelu|design|09:25:00|09:25:00|0|0
2026-07-27|Mon|FS0391|Shashwath Pasupathi|erp|09:53:00|09:53:00|0|0
2026-07-27|Mon|FS0037|Sivashankaran P|dev|09:23:00|09:38:00|15|900
2026-07-27|Mon|FS0038|Sooriya Balaji Iyappan|dev|09:20:00|09:35:00|15|900
2026-07-27|Mon|FS0324|Sowmya Prabhu|testing|09:53:00|10:23:00|30|1800
2026-07-27|Mon|FS0329|Sridhar Kumar S|erp|09:12:00|10:07:00|54|3300
2026-07-27|Mon|FS0428|Sriganth Chennan|cyber|10:13:00|10:43:00|30|1800
2026-07-27|Mon|FS0318|Suresh Babu S|testing|09:36:00|10:06:00|30|1800
2026-07-27|Mon|FS0430|Syed Riyas Niyas|cyber|09:59:00|20:24:00|625|37500
2026-07-27|Mon|FS0333|Theeban Babu S|dev|09:29:00|10:22:00|53|3180
2026-07-27|Mon|FS0040|Veeravel Devaraj|ml|07:43:00|07:58:00|15|900
2026-07-27|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:08:00|10:38:00|30|1800
2026-07-27|Mon|FS0291|Vicky  Kumar|erp|09:02:00|09:02:00|0|0
2026-07-27|Mon|FS0302|Vignesh  Babu|cyber|09:02:00|09:32:00|30|1800
2026-07-27|Mon|FS0325|Vijay Prakash A|testing|10:01:00|10:31:00|30|1800
2026-07-27|Mon|FS0239|VIJAY S R|testing|09:30:00|10:10:00|39|2400
2026-07-27|Mon|FS0353|Vishal Jayaraman|cyber|10:40:00|11:10:00|30|1800
2026-07-27|Mon|FS0035|Vivek I|cyber|09:30:00|09:58:00|27|1680
2026-07-27|Mon|FS0408|Yogeshwaran Govindaraj|erp|09:22:00|09:22:00|0|0
2026-07-27|Mon|FS0090|Yogeswaran Murugavel|cyber|09:39:00|10:09:00|30|1800
2026-07-28|Tue|FS0190|Anurag Virendrakumar|devops|09:33:00|09:48:00|15|900
2026-07-28|Tue|FS0021|ARJUN V|dev|08:40:00|08:55:00|15|900
2026-07-28|Tue|FS0426|Astin Ravi|cyber|09:17:00|09:47:00|30|1800
2026-07-28|Tue|FS0050|Avinash Pandian|cyber|10:04:00|10:34:00|30|1800
2026-07-28|Tue|FS0049|Balaji|dev|10:04:00|10:19:00|15|900
2026-07-28|Tue|FS0193|Bharath Selvam|data|09:30:00|09:40:00|9|600
2026-07-28|Tue|FS0194|Bharathi Arjunan|dev|09:36:00|10:52:00|75|4560
2026-07-28|Tue|FS0377|Daniel Raj N|it support|09:36:00|12:29:00|173|10380
2026-07-28|Tue|FS0303|Deepeka|dev|09:12:00|09:27:00|15|900
2026-07-28|Tue|FS0277|Deepesh Raj B|dev|10:22:00|10:37:00|15|900
2026-07-28|Tue|FS0243|DELLIBABU T|finance|09:36:00|10:06:00|30|1800
2026-07-28|Tue|FS0281|Dhanalakshmi S|dev|09:39:00|07:15:00|1296|77760
2026-07-28|Tue|FS0101|Dhiwan Mariappan|finance|07:51:00|08:21:00|30|1800
2026-07-28|Tue|FC0002|Dileep Thammana|finance|09:30:00|10:06:00|35|2160
2026-07-28|Tue|FS0320|Gayathri K|data|09:30:00|09:45:00|15|900
2026-07-28|Tue|FS0073|Gokulakannan Selvam|design|07:54:00|08:00:00|6|360
2026-07-28|Tue|FS0161|Haridha Muruganantham|erp|09:44:00|09:44:00|0|0
2026-07-28|Tue|FS0036|Jai Surya S|design|09:42:00|09:57:00|14|900
2026-07-28|Tue|FS0425|Jayachandran Iswaran|cyber|09:32:00|09:57:00|25|1500
2026-07-28|Tue|FS0289|Kantha  Kumar K|dev|08:48:00|08:52:00|4|240
2026-07-28|Tue|FS0150|Karthikesan RajaRaman|dev|09:30:00|09:38:00|8|480
2026-07-28|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:28:00|08:48:00|1400|84000
2026-07-28|Tue|FS0323|Kishore M|devops|11:03:00|11:18:00|15|900
2026-07-28|Tue|FS0158|Kishore Theiveekan|dev|09:08:00|04:48:00|1179|70800
2026-07-28|Tue|FS0126|Lakshmi Prasanna U|admin|10:31:00|10:31:00|0|0
2026-07-28|Tue|FS0437|Lenci Manuela L|it support|09:24:00|12:10:00|166|9960
2026-07-28|Tue|FST0022|Madhumitha Chandrasekaran|finance|10:01:00|10:31:00|30|1800
2026-07-28|Tue|FS0339|Magesh Kumar|cyber|09:49:00|13:03:00|193|11640
2026-07-28|Tue|FS0326|Mahasri Seenivasan|data|09:39:00|11:22:00|103|6180
2026-07-28|Tue|FS0135|MAHESH T|cyber|01:44:00|02:14:00|30|1800
2026-07-28|Tue|FS0027|Manikadan P|design|09:30:00|09:33:00|3|180
2026-07-28|Tue|FS0076|Meena Rajendran|testing|09:22:00|09:52:00|30|1800
2026-07-28|Tue|FS0427|Mukesh Muthusamy|cyber|09:22:00|09:52:00|30|1800
2026-07-28|Tue|FS0390|Naveen Prasad Moorthy|dev|09:12:00|09:27:00|15|900
2026-07-28|Tue|FS0287|Nedunchezhiyan  M|dev|08:16:00|08:31:00|15|900
2026-07-28|Tue|FS0321|Nithyanantham V|devops|09:14:00|09:29:00|15|900
2026-07-28|Tue|FS0209|Pravinabdulkalam Mathikannan|dev|09:20:00|14:38:00|317|19080
2026-07-28|Tue|FST0011|Preethi Bernadath|finance|09:45:00|10:14:00|28|1740
2026-07-28|Tue|FS0144|Ragul Priyan Murugan|dev|11:11:00|11:26:00|15|900
2026-07-28|Tue|FS0331|Rajesh Kumar A|testing|09:30:00|10:05:00|35|2100
2026-07-28|Tue|FS0424|Rajesh Pannirselvame|cyber|08:52:00|09:22:00|30|1800
2026-07-28|Tue|FS0398|Ranganathan C|erp|09:31:00|09:36:00|5|300
2026-07-28|Tue|FS0400|Rexlin Felix S|erp|09:44:00|09:44:00|0|0
2026-07-28|Tue|FS0438|Sangeetha Balasubramanian|testing|09:33:00|11:22:00|108|6540
2026-07-28|Tue|FS0409|Sanjay Boopathy M|finance|10:04:00|10:34:00|30|1800
2026-07-28|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:10:00|09:25:00|15|900
2026-07-28|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:23:00|09:38:00|15|900
2026-07-28|Tue|FS0334|Sarathi S S|testing|09:45:00|09:56:00|11|660
2026-07-28|Tue|FS0031|Saravana Pandian S|design|09:24:00|09:24:00|0|0
2026-07-28|Tue|FS0106|Saravanan Devendhiran|dev|09:23:00|09:38:00|15|900
2026-07-28|Tue|FS0231|Saritha Sekar|risk|10:44:00|10:44:00|0|0
2026-07-28|Tue|FS0148|Selvaprakash Balan|dev|09:04:00|09:19:00|15|900
2026-07-28|Tue|FS0125|Shahul Hameed Abdul Samad|risk|03:29:00|03:29:00|0|0
2026-07-28|Tue|FS0215|Shanmugam Mohanasundaram|dev|10:44:00|10:59:00|15|900
2026-07-28|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:33:00|09:33:00|0|0
2026-07-28|Tue|FS0391|Shashwath Pasupathi|erp|09:53:00|09:53:00|0|0
2026-07-28|Tue|FS0037|Sivashankaran P|dev|09:27:00|09:42:00|15|900
2026-07-28|Tue|FS0038|Sooriya Balaji Iyappan|dev|09:04:00|09:19:00|15|900
2026-07-28|Tue|FS0324|Sowmya Prabhu|testing|09:51:00|10:21:00|30|1800
2026-07-28|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:25:00|09:57:00|31|1920
2026-07-28|Tue|FS0329|Sridhar Kumar S|erp|09:16:00|09:59:00|42|2580
2026-07-28|Tue|FS0428|Sriganth Chennan|cyber|09:57:00|10:27:00|30|1800
2026-07-28|Tue|FS0318|Suresh Babu S|testing|09:46:00|10:16:00|30|1800
2026-07-28|Tue|FS0430|Syed Riyas Niyas|cyber|09:57:00|10:44:00|46|2820
2026-07-28|Tue|FS0333|Theeban Babu S|dev|09:12:00|10:52:00|100|6000
2026-07-28|Tue|FS0040|Veeravel Devaraj|ml|00:49:00|01:04:00|15|900
2026-07-28|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:09:00|10:39:00|30|1800
2026-07-28|Tue|FS0291|Vicky  Kumar|erp|09:34:00|09:34:00|0|0
2026-07-28|Tue|FS0302|Vignesh  Babu|cyber|08:58:00|09:28:00|30|1800
2026-07-28|Tue|FS0325|Vijay Prakash A|testing|10:09:00|10:39:00|30|1800
2026-07-28|Tue|FS0353|Vishal Jayaraman|cyber|09:45:00|09:46:00|0|60
2026-07-28|Tue|FS0219|Visvesvaran Kumaran|dev|09:30:00|10:03:00|33|1980
2026-07-28|Tue|FS0035|Vivek I|cyber|09:45:00|10:25:00|39|2400
2026-07-28|Tue|FS0294|Yamuna  M|dev|09:45:00|10:27:00|41|2520
2026-07-28|Tue|FS0089|Yogeshwaran Chandrakasan|dev|11:21:00|11:36:00|15|900
2026-07-28|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:37:00|09:37:00|0|0
2026-07-28|Tue|FS0090|Yogeswaran Murugavel|cyber|00:34:00|01:04:00|30|1800
2026-07-29|Wed|FS0439|Abinesh Nagarajan|devops|09:30:00|09:59:00|28|1740
2026-07-29|Wed|FS0189|Ajay Parameswaran|dev|09:30:00|09:38:00|8|480
2026-07-29|Wed|FS0152|Ajith Kumar Ramalingam|dev|09:45:00|10:24:00|38|2340
2026-07-29|Wed|FS0190|Anurag Virendrakumar|devops|09:16:00|09:31:00|15|900
2026-07-29|Wed|FS0050|Avinash Pandian|cyber|03:30:00|04:00:00|30|1800
2026-07-29|Wed|FS0049|Balaji|dev|10:02:00|10:17:00|15|900
2026-07-29|Wed|FS0193|Bharath Selvam|data|08:24:00|01:09:00|1004|60300
2026-07-29|Wed|FS0194|Bharathi Arjunan|dev|09:55:00|10:04:00|8|540
2026-07-29|Wed|FS0195|David Mariyajebamalai|dev|10:58:00|03:34:00|995|59760
2026-07-29|Wed|FS0340|Deepa K|testing|09:45:00|10:14:00|28|1740
2026-07-29|Wed|FS0303|Deepeka|dev|09:28:00|09:43:00|15|900
2026-07-29|Wed|FS0277|Deepesh Raj B|dev|09:55:00|10:10:00|15|900
2026-07-29|Wed|FS0243|DELLIBABU T|finance|09:49:00|10:19:00|30|1800
2026-07-29|Wed|FS0281|Dhanalakshmi S|dev|09:26:00|09:32:00|6|360
2026-07-29|Wed|FS0101|Dhiwan Mariappan|finance|07:52:00|08:22:00|30|1800
2026-07-29|Wed|FS0046|Divya Priya Senthilkumaran|pm|11:03:00|11:03:00|0|0
2026-07-29|Wed|FS0311|Ganesh D|design|09:30:00|09:48:00|17|1080
2026-07-29|Wed|FS0320|Gayathri K|data|09:21:00|09:36:00|15|900
2026-07-29|Wed|FS0319|Gokulakannan Duraisamy|ml|09:45:00|10:11:00|26|1560
2026-07-29|Wed|FS0073|Gokulakannan Selvam|design|07:57:00|08:03:00|5|360
2026-07-29|Wed|FS0161|Haridha Muruganantham|erp|10:10:00|10:10:00|0|0
2026-07-29|Wed|FS0036|Jai Surya S|design|10:09:00|11:08:00|58|3540
2026-07-29|Wed|FS0350|Janaki L|testing|09:30:00|09:31:00|1|60
2026-07-29|Wed|FS0425|Jayachandran Iswaran|cyber|09:37:00|09:39:00|1|120
2026-07-29|Wed|FST0013|Kalashree A|finance|09:30:00|09:32:00|2|120
2026-07-29|Wed|FS0289|Kantha  Kumar K|dev|09:12:00|09:17:00|4|300
2026-07-29|Wed|FS0150|Karthikesan RajaRaman|dev|05:35:00|12:18:00|403|24180
2026-07-29|Wed|FS0200|Kavinkumar Ramasamy|dev|09:45:00|10:18:00|33|1980
2026-07-29|Wed|FS0433|keerthivaasen.v@finstein.ai|cyber|09:25:00|08:48:00|1403|84180
2026-07-29|Wed|FS0158|Kishore Theiveekan|dev|09:39:00|09:54:00|15|900
2026-07-29|Wed|FS0126|Lakshmi Prasanna U|admin|10:41:00|10:41:00|0|0
2026-07-29|Wed|FS0437|Lenci Manuela L|it support|09:59:00|09:23:00|1403|84240
2026-07-29|Wed|FST0022|Madhumitha Chandrasekaran|finance|08:21:00|08:51:00|30|1800
2026-07-29|Wed|FS0339|Magesh Kumar|cyber|09:32:00|09:38:00|5|360
2026-07-29|Wed|FS0326|Mahasri Seenivasan|data|09:39:00|11:08:00|89|5340
2026-07-29|Wed|FS0135|MAHESH T|cyber|00:13:00|00:43:00|30|1800
2026-07-29|Wed|FS0027|Manikadan P|design|10:51:00|11:19:00|27|1680
2026-07-29|Wed|FS0297|Maruthan G|dev|09:30:00|09:52:00|21|1320
2026-07-29|Wed|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|09:40:00|9|600
2026-07-29|Wed|FS0076|Meena Rajendran|testing|09:30:00|09:55:00|25|1500
2026-07-29|Wed|FS0427|Mukesh Muthusamy|cyber|09:31:00|10:01:00|30|1800
2026-07-29|Wed|FS0298|Nantha Guru|dev|09:45:00|10:31:00|45|2760
2026-07-29|Wed|FS0390|Naveen Prasad Moorthy|dev|08:24:00|08:29:00|4|300
2026-07-29|Wed|FS0287|Nedunchezhiyan  M|dev|10:47:00|11:02:00|15|900
2026-07-29|Wed|FS0154|Nethaji Srinivasan|dev|09:30:00|09:55:00|25|1500
2026-07-29|Wed|FS0321|Nithyanantham V|devops|09:27:00|09:42:00|15|900
2026-07-29|Wed|FS0306|PRAKASH K|dev|09:45:00|10:26:00|41|2460
2026-07-29|Wed|FS0322|Praveenkumar Saminathan|devops|09:30:00|10:13:00|43|2580
2026-07-29|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|10:17:00|08:40:00|1342|80580
2026-07-29|Wed|FST0011|Preethi Bernadath|finance|10:55:00|11:25:00|30|1800
2026-07-29|Wed|FS0404|Prem Shankar S|erp|10:08:00|10:08:00|0|0
2026-07-29|Wed|FS0144|Ragul Priyan Murugan|dev|01:00:00|01:15:00|15|900
2026-07-29|Wed|FS0331|Rajesh Kumar A|testing|09:30:00|09:55:00|24|1500
2026-07-29|Wed|FS0424|Rajesh Pannirselvame|cyber|08:57:00|09:27:00|30|1800
2026-07-29|Wed|FS0142|Rajesh Rajendran|dev|09:30:00|10:05:00|35|2100
2026-07-29|Wed|FS0398|Ranganathan C|erp|09:14:00|09:19:00|5|300
2026-07-29|Wed|FS0400|Rexlin Felix S|erp|09:48:00|09:48:00|0|0
2026-07-29|Wed|FS0023|Sakthivel M|erp|11:27:00|11:27:00|0|0
2026-07-29|Wed|FS0079|Sakthivel Mageshwaran|cyber|09:25:00|09:55:00|30|1800
2026-07-29|Wed|FS0438|Sangeetha Balasubramanian|testing|09:34:00|09:39:00|4|300
2026-07-29|Wed|FS0409|Sanjay Boopathy M|finance|10:21:00|10:51:00|30|1800
2026-07-29|Wed|FS0212|Santhosh Neelakandamoorthy|dev|09:46:00|16:44:00|418|25080
2026-07-29|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:39:00|09:54:00|15|900
2026-07-29|Wed|FS0334|Sarathi S S|testing|09:45:00|10:13:00|27|1680
2026-07-29|Wed|FS0106|Saravanan Devendhiran|dev|09:30:00|09:45:00|15|900
2026-07-29|Wed|FS0148|Selvaprakash Balan|dev|09:07:00|16:00:00|412|24780
2026-07-29|Wed|FS0125|Shahul Hameed Abdul Samad|risk|03:29:00|03:29:00|0|0
2026-07-29|Wed|FS0080|Shamili Anbuselvan|dev|09:30:00|10:15:00|44|2700
2026-07-29|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:18:00|18:07:00|529|31740
2026-07-29|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:21:00|09:21:00|0|0
2026-07-29|Wed|FS0391|Shashwath Pasupathi|erp|09:48:00|09:48:00|0|0
2026-07-29|Wed|FS0037|Sivashankaran P|dev|09:23:00|09:38:00|15|900
2026-07-29|Wed|FS0038|Sooriya Balaji Iyappan|dev|09:45:00|10:19:00|33|2040
2026-07-29|Wed|FS0324|Sowmya Prabhu|testing|09:57:00|10:27:00|30|1800
2026-07-29|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:32:00|09:38:00|5|360
2026-07-29|Wed|FS0329|Sridhar Kumar S|erp|09:12:00|09:18:00|5|360
2026-07-29|Wed|FS0082|Stalin Innacimuthu|dev|09:30:00|09:56:00|26|1560
2026-07-29|Wed|FS0318|Suresh Babu S|testing|09:50:00|10:20:00|30|1800
2026-07-29|Wed|FS0085|Suryapriya Saravanan|dev|11:20:00|11:35:00|15|900
2026-07-29|Wed|FS0372|Suthir Tamilselvan|finance|10:54:00|11:24:00|30|1800
2026-07-29|Wed|FS0430|Syed Riyas Niyas|cyber|00:18:00|00:00:00|1422|85320
2026-07-29|Wed|FS0333|Theeban Babu S|dev|08:24:00|08:32:00|8|480
2026-07-29|Wed|FS0040|Veeravel Devaraj|ml|09:30:00|09:59:00|28|1740
2026-07-29|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:10:00|10:40:00|30|1800
2026-07-29|Wed|FS0291|Vicky  Kumar|erp|09:30:00|09:43:00|12|780
2026-07-29|Wed|FS0302|Vignesh  Babu|cyber|08:15:00|08:45:00|30|1800
2026-07-29|Wed|FS0325|Vijay Prakash A|testing|10:13:00|10:43:00|30|1800
2026-07-29|Wed|FS0239|VIJAY S R|testing|09:45:00|10:11:00|25|1560
2026-07-29|Wed|FS0353|Vishal Jayaraman|cyber|10:28:00|10:58:00|30|1800
2026-07-29|Wed|FS0341|Vishnu Priya|testing|09:30:00|09:45:00|14|900
2026-07-29|Wed|FS0219|Visvesvaran Kumaran|dev|09:30:00|09:42:00|12|720
2026-07-29|Wed|FS0035|Vivek I|cyber|09:30:00|09:38:00|8|480
2026-07-29|Wed|FS0294|Yamuna  M|dev|09:45:00|10:20:00|34|2100
2026-07-29|Wed|FS0089|Yogeshwaran Chandrakasan|dev|05:36:00|05:51:00|15|900
2026-07-29|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:18:00|09:18:00|0|0
2026-07-29|Wed|FS0090|Yogeswaran Murugavel|cyber|03:32:00|04:02:00|30|1800
2026-07-30|Thu|FS0439|Abinesh Nagarajan|devops|09:47:00|10:02:00|15|900
2026-07-30|Thu|FS0189|Ajay Parameswaran|dev|09:30:00|09:43:00|12|780
2026-07-30|Thu|FS0152|Ajith Kumar Ramalingam|dev|10:13:00|10:28:00|15|900
2026-07-30|Thu|FS0342|Ashraf A|testing|09:45:00|09:47:00|1|120
2026-07-30|Thu|FS0018|Asmath Nisha|finance|10:05:00|10:27:00|21|1320
2026-07-30|Thu|FS0426|Astin Ravi|cyber|09:47:00|10:17:00|30|1800
2026-07-30|Thu|FS0193|Bharath Selvam|data|06:34:00|06:38:00|4|240
2026-07-30|Thu|FS0194|Bharathi Arjunan|dev|09:38:00|09:42:00|4|240
2026-07-30|Thu|FS0377|Daniel Raj N|it support|09:31:00|00:08:00|877|52620
2026-07-30|Thu|FS0195|David Mariyajebamalai|dev|09:37:00|05:13:00|1176|70560
2026-07-30|Thu|FS0340|Deepa K|testing|09:26:00|09:56:00|30|1800
2026-07-30|Thu|FS0303|Deepeka|dev|09:30:00|09:45:00|15|900
2026-07-30|Thu|FS0277|Deepesh Raj B|dev|11:07:00|11:22:00|15|900
2026-07-30|Thu|FS0243|DELLIBABU T|finance|09:56:00|10:26:00|30|1800
2026-07-30|Thu|FS0101|Dhiwan Mariappan|finance|08:06:00|08:36:00|30|1800
2026-07-30|Thu|FC0002|Dileep Thammana|finance|09:45:00|10:16:00|30|1860
2026-07-30|Thu|FS0311|Ganesh D|design|10:48:00|11:32:00|44|2640
2026-07-30|Thu|FS0320|Gayathri K|data|09:42:00|09:57:00|15|900
2026-07-30|Thu|FS0228|Geetha Karnan|risk|09:30:00|10:15:00|45|2700
2026-07-30|Thu|FS0319|Gokulakannan Duraisamy|ml|09:45:00|09:55:00|9|600
2026-07-30|Thu|FS0073|Gokulakannan Selvam|design|07:58:00|08:05:00|6|420
2026-07-30|Thu|FS0161|Haridha Muruganantham|erp|10:10:00|10:10:00|0|0
2026-07-30|Thu|FS0343|Hariharan Vijayakumar|erp|09:34:00|09:34:00|0|0
2026-07-30|Thu|FS0036|Jai Surya S|design|09:58:00|10:27:00|28|1740
2026-07-30|Thu|FS0350|Janaki L|testing|09:05:00|09:35:00|30|1800
2026-07-30|Thu|FS0425|Jayachandran Iswaran|cyber|09:30:00|09:36:00|5|360
2026-07-30|Thu|FST0013|Kalashree A|finance|11:04:00|11:34:00|29|1800
2026-07-30|Thu|FS0289|Kantha  Kumar K|dev|08:49:00|08:55:00|5|360
2026-07-30|Thu|FS0150|Karthikesan RajaRaman|dev|09:42:00|09:47:00|4|300
2026-07-30|Thu|FS0200|Kavinkumar Ramasamy|dev|00:33:00|00:48:00|15|900
2026-07-30|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|07:58:00|01:01:00|1023|61380
2026-07-30|Thu|FS0323|Kishore M|devops|09:45:00|10:12:00|27|1620
2026-07-30|Thu|FS0158|Kishore Theiveekan|dev|09:58:00|10:12:00|14|840
2026-07-30|Thu|FS0039|Kumaresan Krishnan|finance|09:45:00|10:24:00|39|2340
2026-07-30|Thu|FS0126|Lakshmi Prasanna U|admin|10:59:00|10:59:00|0|0
2026-07-30|Thu|FS0437|Lenci Manuela L|it support|09:37:00|10:50:00|72|4380
2026-07-30|Thu|FST0022|Madhumitha Chandrasekaran|finance|08:45:00|09:15:00|30|1800
2026-07-30|Thu|FS0339|Magesh Kumar|cyber|10:13:00|10:46:00|33|1980
2026-07-30|Thu|FS0326|Mahasri Seenivasan|data|09:37:00|00:22:00|884|53100
2026-07-30|Thu|FS0135|MAHESH T|cyber|00:52:00|01:22:00|30|1800
2026-07-30|Thu|FS0297|Maruthan G|dev|02:16:00|02:31:00|15|900
2026-07-30|Thu|FS0133|maruthupandiyan mathuraiveeran|dev|09:45:00|10:11:00|26|1560
2026-07-30|Thu|FS0076|Meena Rajendran|testing|10:10:00|10:40:00|30|1800
2026-07-30|Thu|FS0427|Mukesh Muthusamy|cyber|09:45:00|10:07:00|22|1320
2026-07-30|Thu|FS0298|Nantha Guru|dev|09:28:00|11:31:00|123|7380
2026-07-30|Thu|FS0287|Nedunchezhiyan  M|dev|07:55:00|08:10:00|15|900
2026-07-30|Thu|FS0321|Nithyanantham V|devops|09:08:00|09:23:00|15|900
2026-07-30|Thu|FS0306|PRAKASH K|dev|08:58:00|09:13:00|15|900
2026-07-30|Thu|FS0322|Praveenkumar Saminathan|devops|11:07:00|11:22:00|15|900
2026-07-30|Thu|FS0209|Pravinabdulkalam Mathikannan|dev|10:52:00|14:08:00|195|11760
2026-07-30|Thu|FST0011|Preethi Bernadath|finance|10:55:00|11:25:00|30|1800
2026-07-30|Thu|FS0404|Prem Shankar S|erp|10:13:00|10:13:00|0|0
2026-07-30|Thu|FS0144|Ragul Priyan Murugan|dev|00:58:00|01:13:00|15|900
2026-07-30|Thu|FS0331|Rajesh Kumar A|testing|10:07:00|10:37:00|30|1800
2026-07-30|Thu|FS0424|Rajesh Pannirselvame|cyber|09:45:00|10:15:00|30|1800
2026-07-30|Thu|FS0142|Rajesh Rajendran|dev|10:28:00|14:42:00|253|15240
2026-07-30|Thu|FS0398|Ranganathan C|erp|09:42:00|09:47:00|5|300
2026-07-30|Thu|FS0400|Rexlin Felix S|erp|09:40:00|09:40:00|0|0
2026-07-30|Thu|FS0023|Sakthivel M|erp|11:10:00|11:10:00|0|0
2026-07-30|Thu|FS0079|Sakthivel Mageshwaran|cyber|11:26:00|11:56:00|30|1800
2026-07-30|Thu|FS0438|Sangeetha Balasubramanian|testing|09:22:00|09:27:00|4|300
2026-07-30|Thu|FS0409|Sanjay Boopathy M|finance|10:27:00|10:57:00|30|1800
2026-07-30|Thu|FS0212|Santhosh Neelakandamoorthy|dev|10:02:00|00:19:00|856|51420
2026-07-30|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:50:00|10:05:00|15|900
2026-07-30|Thu|FS0031|Saravana Pandian S|design|10:39:00|10:39:00|0|0
2026-07-30|Thu|FS0106|Saravanan Devendhiran|dev|10:12:00|10:27:00|15|900
2026-07-30|Thu|FS0148|Selvaprakash Balan|dev|09:18:00|09:23:00|5|300
2026-07-30|Thu|FS0125|Shahul Hameed Abdul Samad|risk|09:30:00|09:52:00|21|1320
2026-07-30|Thu|FS0080|Shamili Anbuselvan|dev|09:47:00|10:02:00|15|900
2026-07-30|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:18:00|09:23:00|4|300
2026-07-30|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:53:00|09:53:00|0|0
2026-07-30|Thu|FS0391|Shashwath Pasupathi|erp|10:13:00|15:40:00|326|19620
2026-07-30|Thu|FS0037|Sivashankaran P|dev|09:11:00|09:26:00|15|900
2026-07-30|Thu|FS0038|Sooriya Balaji Iyappan|dev|08:09:00|08:24:00|15|900
2026-07-30|Thu|FS0324|Sowmya Prabhu|testing|09:55:00|10:25:00|30|1800
2026-07-30|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:30:00|10:27:00|56|3420
2026-07-30|Thu|FS0329|Sridhar Kumar S|erp|09:28:00|09:34:00|5|360
2026-07-30|Thu|FS0428|Sriganth Chennan|cyber|09:56:00|10:26:00|30|1800
2026-07-30|Thu|FS0318|Suresh Babu S|testing|09:53:00|10:23:00|30|1800
2026-07-30|Thu|FS0085|Suryapriya Saravanan|dev|11:10:00|11:25:00|15|900
2026-07-30|Thu|FS0372|Suthir Tamilselvan|finance|09:45:00|10:12:00|27|1620
2026-07-30|Thu|FS0430|Syed Riyas Niyas|cyber|10:14:00|06:18:00|1203|72240
2026-07-30|Thu|FS0333|Theeban Babu S|dev|08:19:00|08:24:00|4|300
2026-07-30|Thu|FS0040|Veeravel Devaraj|ml|09:27:00|09:42:00|15|900
2026-07-30|Thu|FS0291|Vicky  Kumar|erp|09:44:00|09:50:00|5|360
2026-07-30|Thu|FS0302|Vignesh  Babu|cyber|08:08:00|08:38:00|30|1800
2026-07-30|Thu|FS0325|Vijay Prakash A|testing|10:10:00|19:15:00|545|32700
2026-07-30|Thu|FS0239|VIJAY S R|testing|09:45:00|10:00:00|14|900
2026-07-30|Thu|FS0341|Vishnu Priya|testing|09:55:00|10:25:00|30|1800
2026-07-30|Thu|FS0035|Vivek I|cyber|09:30:00|09:38:00|8|480
2026-07-30|Thu|FS0294|Yamuna  M|dev|09:30:00|09:36:00|5|360
2026-07-30|Thu|FS0089|Yogeshwaran Chandrakasan|dev|01:21:00|01:36:00|15|900
2026-07-30|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:06:00|09:06:00|0|0
2026-07-30|Thu|FS0090|Yogeswaran Murugavel|cyber|09:28:00|09:58:00|30|1800
2026-07-31|Fri|FS0439|Abinesh Nagarajan|devops|09:49:00|10:04:00|15|900
2026-07-31|Fri|FS0189|Ajay Parameswaran|dev|01:21:00|00:06:00|1364|81900
2026-07-31|Fri|FS0152|Ajith Kumar Ramalingam|dev|09:30:00|09:57:00|26|1620
2026-07-31|Fri|FS0190|Anurag Virendrakumar|devops|09:09:00|09:24:00|15|900
2026-07-31|Fri|FS0021|ARJUN V|dev|07:20:00|07:35:00|15|900
2026-07-31|Fri|FS0342|Ashraf A|testing|01:14:00|11:17:00|603|36180
2026-07-31|Fri|FS0018|Asmath Nisha|finance|10:15:00|10:47:00|32|1920
2026-07-31|Fri|FS0426|Astin Ravi|cyber|09:22:00|09:52:00|30|1800
2026-07-31|Fri|FS0050|Avinash Pandian|cyber|10:02:00|10:32:00|30|1800
2026-07-31|Fri|FS0049|Balaji|dev|10:02:00|10:17:00|15|900
2026-07-31|Fri|FS0193|Bharath Selvam|data|09:45:00|09:51:00|5|360
2026-07-31|Fri|FS0194|Bharathi Arjunan|dev|09:49:00|09:56:00|6|420
2026-07-31|Fri|FS0377|Daniel Raj N|it support|09:38:00|03:54:00|1095|65760
2026-07-31|Fri|FS0195|David Mariyajebamalai|dev|10:31:00|00:00:00|809|48540
2026-07-31|Fri|FS0277|Deepesh Raj B|dev|11:01:00|11:16:00|15|900
2026-07-31|Fri|FS0243|DELLIBABU T|finance|09:31:00|10:01:00|30|1800
2026-07-31|Fri|FS0281|Dhanalakshmi S|dev|09:16:00|05:10:00|1194|71640
2026-07-31|Fri|FS0101|Dhiwan Mariappan|finance|07:45:00|08:15:00|30|1800
2026-07-31|Fri|FS0073|Gokulakannan Selvam|design|07:59:00|08:07:00|7|480
2026-07-31|Fri|FS0161|Haridha Muruganantham|erp|09:37:00|09:37:00|0|0
2026-07-31|Fri|FS0343|Hariharan Vijayakumar|erp|09:36:00|09:36:00|0|0
2026-07-31|Fri|FS0036|Jai Surya S|design|09:19:00|09:24:00|5|300
2026-07-31|Fri|FS0350|Janaki L|testing|09:30:00|09:55:00|24|1500
2026-07-31|Fri|FS0237|JONES  KAPIL L|testing|09:45:00|10:16:00|30|1860
2026-07-31|Fri|FS0289|Kantha  Kumar K|dev|08:56:00|09:01:00|4|300
2026-07-31|Fri|FS0150|Karthikesan RajaRaman|dev|05:37:00|12:31:00|414|24840
2026-07-31|Fri|FS0200|Kavinkumar Ramasamy|dev|09:30:00|09:38:00|8|480
2026-07-31|Fri|FS0433|keerthivaasen.v@finstein.ai|cyber|08:05:00|08:13:00|8|480
2026-07-31|Fri|FS0323|Kishore M|devops|11:04:00|11:41:00|36|2220
2026-07-31|Fri|FS0158|Kishore Theiveekan|dev|10:09:00|10:25:00|15|960
2026-07-31|Fri|FS0339|Magesh Kumar|cyber|10:01:00|10:06:00|4|300
2026-07-31|Fri|FS0326|Mahasri Seenivasan|data|09:31:00|09:37:00|6|360
2026-07-31|Fri|FS0135|MAHESH T|cyber|02:23:00|02:53:00|30|1800
2026-07-31|Fri|FS0297|Maruthan G|dev|01:06:00|01:21:00|15|900
2026-07-31|Fri|FS0133|maruthupandiyan mathuraiveeran|dev|01:05:00|01:20:00|15|900
2026-07-31|Fri|FS0076|Meena Rajendran|testing|10:44:00|11:14:00|30|1800
2026-07-31|Fri|FS0427|Mukesh Muthusamy|cyber|09:22:00|09:52:00|30|1800
2026-07-31|Fri|FS0390|Naveen Prasad Moorthy|dev|09:09:00|09:15:00|5|360
2026-07-31|Fri|FS0287|Nedunchezhiyan  M|dev|07:37:00|07:52:00|15|900
2026-07-31|Fri|FS0321|Nithyanantham V|devops|08:31:00|08:46:00|15|900
2026-07-31|Fri|FS0306|PRAKASH K|dev|01:05:00|01:20:00|15|900
2026-07-31|Fri|FS0322|Praveenkumar Saminathan|devops|11:09:00|11:24:00|15|900
2026-07-31|Fri|FS0209|Pravinabdulkalam Mathikannan|dev|10:44:00|11:03:00|19|1140
2026-07-31|Fri|FS0404|Prem Shankar S|erp|10:15:00|10:15:00|0|0
2026-07-31|Fri|FS0144|Ragul Priyan Murugan|dev|05:49:00|06:04:00|15|900
2026-07-31|Fri|FS0331|Rajesh Kumar A|testing|06:58:00|07:28:00|30|1800
2026-07-31|Fri|FS0424|Rajesh Pannirselvame|cyber|09:22:00|09:52:00|30|1800
2026-07-31|Fri|FS0398|Ranganathan C|erp|09:33:00|09:38:00|4|300
2026-07-31|Fri|FS0400|Rexlin Felix S|erp|09:51:00|09:51:00|0|0
2026-07-31|Fri|FS0079|Sakthivel Mageshwaran|cyber|10:43:00|11:13:00|30|1800
2026-07-31|Fri|FS0438|Sangeetha Balasubramanian|testing|09:26:00|09:31:00|4|300
2026-07-31|Fri|FS0409|Sanjay Boopathy M|finance|10:17:00|21:06:00|648|38940
2026-07-31|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:50:00|09:54:00|4|240
2026-07-31|Fri|FS0442|Santhoshkumar Palanichamy|dev|10:42:00|10:57:00|15|900
2026-07-31|Fri|FS0106|Saravanan Devendhiran|dev|09:58:00|10:13:00|15|900
2026-07-31|Fri|FS0231|Saritha Sekar|risk|10:28:00|10:28:00|0|0
2026-07-31|Fri|FS0148|Selvaprakash Balan|dev|09:35:00|09:41:00|5|360
2026-07-31|Fri|FS0125|Shahul Hameed Abdul Samad|risk|01:22:00|01:22:00|0|0
2026-07-31|Fri|FS0080|Shamili Anbuselvan|dev|09:45:00|10:18:00|33|1980
2026-07-31|Fri|FS0215|Shanmugam Mohanasundaram|dev|09:35:00|09:40:00|5|300
2026-07-31|Fri|FS0022|Shashti Priyan shathiyavelu|design|10:08:00|10:08:00|0|0
2026-07-31|Fri|FS0391|Shashwath Pasupathi|erp|09:30:00|09:58:00|28|1680
2026-07-31|Fri|FS0037|Sivashankaran P|dev|08:47:00|09:02:00|15|900
2026-07-31|Fri|FS0038|Sooriya Balaji Iyappan|dev|09:30:00|10:04:00|34|2040
2026-07-31|Fri|FS0324|Sowmya Prabhu|testing|09:58:00|13:17:00|198|11940
2026-07-31|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:31:00|09:37:00|5|360
2026-07-31|Fri|FS0329|Sridhar Kumar S|erp|09:21:00|09:29:00|7|480
2026-07-31|Fri|FS0428|Sriganth Chennan|cyber|09:58:00|10:28:00|30|1800
2026-07-31|Fri|FS0318|Suresh Babu S|testing|09:31:00|12:41:00|189|11400
2026-07-31|Fri|FS0085|Suryapriya Saravanan|dev|10:36:00|10:51:00|15|900
2026-07-31|Fri|FS0430|Syed Riyas Niyas|cyber|09:57:00|10:01:00|4|240
2026-07-31|Fri|FS0333|Theeban Babu S|dev|09:09:00|09:14:00|4|300
2026-07-31|Fri|FS0040|Veeravel Devaraj|ml|09:28:00|09:43:00|15|900
2026-07-31|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:45:00|09:46:00|1|60
2026-07-31|Fri|FS0291|Vicky  Kumar|erp|09:54:00|09:59:00|5|300
2026-07-31|Fri|FS0302|Vignesh  Babu|cyber|08:48:00|09:18:00|30|1800
2026-07-31|Fri|FS0325|Vijay Prakash A|testing|10:19:00|01:24:00|905|54300
2026-07-31|Fri|FS0353|Vishal Jayaraman|cyber|10:14:00|10:44:00|30|1800
2026-07-31|Fri|FS0219|Visvesvaran Kumaran|dev|01:29:00|14:54:00|805|48300
2026-07-31|Fri|FS0035|Vivek I|cyber|09:45:00|09:52:00|7|420
2026-07-31|Fri|FS0294|Yamuna  M|dev|10:48:00|11:03:00|15|900
2026-07-31|Fri|FS0089|Yogeshwaran Chandrakasan|dev|00:04:00|00:19:00|15|900
2026-07-31|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:47:00|09:47:00|0|0
2026-07-31|Fri|FS0090|Yogeswaran Murugavel|cyber|09:46:00|10:16:00|30|1800
2026-08-01|Sat|FS0439|Abinesh Nagarajan|devops|10:04:00|10:19:00|15|900
2026-08-01|Sat|FS0342|Ashraf A|testing|09:30:00|09:41:00|11|660
2026-08-01|Sat|FS0426|Astin Ravi|cyber|09:06:00|09:36:00|30|1800
2026-08-01|Sat|FS0050|Avinash Pandian|cyber|10:07:00|10:37:00|30|1800
2026-08-01|Sat|FS0049|Balaji|dev|10:07:00|10:22:00|15|900
2026-08-01|Sat|FS0377|Daniel Raj N|it support|10:32:00|10:32:00|0|0
2026-08-01|Sat|FS0195|David Mariyajebamalai|dev|09:45:00|10:10:00|25|1500
2026-08-01|Sat|FS0277|Deepesh Raj B|dev|10:31:00|10:46:00|15|900
2026-08-01|Sat|FS0243|DELLIBABU T|finance|09:35:00|10:05:00|30|1800
2026-08-01|Sat|FC0002|Dileep Thammana|finance|11:08:00|11:38:00|30|1800
2026-08-01|Sat|FS0046|Divya Priya Senthilkumaran|pm|09:45:00|09:54:00|9|540
2026-08-01|Sat|FS0161|Haridha Muruganantham|erp|10:13:00|10:13:00|0|0
2026-08-01|Sat|FS0343|Hariharan Vijayakumar|erp|09:52:00|09:52:00|0|0
2026-08-01|Sat|FS0036|Jai Surya S|design|09:46:00|09:53:00|6|420
2026-08-01|Sat|FS0350|Janaki L|testing|09:30:00|10:06:00|35|2160
2026-08-01|Sat|FS0237|JONES  KAPIL L|testing|09:45:00|09:45:00|0|0
2026-08-01|Sat|FST0013|Kalashree A|finance|09:30:00|10:07:00|36|2220
2026-08-01|Sat|FS0289|Kantha  Kumar K|dev|08:58:00|09:02:00|4|240
2026-08-01|Sat|FS0433|keerthivaasen.v@finstein.ai|cyber|09:50:00|10:02:00|11|720
2026-08-01|Sat|FS0323|Kishore M|devops|09:24:00|09:29:00|4|300
2026-08-01|Sat|FS0158|Kishore Theiveekan|dev|09:28:00|09:43:00|14|900
2026-08-01|Sat|FS0039|Kumaresan Krishnan|finance|07:02:00|07:32:00|30|1800
2026-08-01|Sat|FS0126|Lakshmi Prasanna U|admin|09:30:00|10:08:00|37|2280
2026-08-01|Sat|FS0135|MAHESH T|cyber|03:09:00|03:39:00|30|1800
2026-08-01|Sat|FS0063|Meenakshi Priya|finance|09:51:00|10:21:00|30|1800
2026-08-01|Sat|FS0427|Mukesh Muthusamy|cyber|09:21:00|09:51:00|30|1800
2026-08-01|Sat|FS0390|Naveen Prasad Moorthy|dev|08:28:00|08:33:00|5|300
2026-08-01|Sat|FS0287|Nedunchezhiyan  M|dev|09:03:00|09:18:00|15|900
2026-08-01|Sat|FS0321|Nithyanantham V|devops|09:06:00|09:21:00|15|900
2026-08-01|Sat|FS0306|PRAKASH K|dev|09:06:00|09:21:00|15|900
2026-08-01|Sat|FS0322|Praveenkumar Saminathan|devops|10:22:00|10:37:00|15|900
2026-08-01|Sat|FS0209|Pravinabdulkalam Mathikannan|dev|10:34:00|10:39:00|5|300
2026-08-01|Sat|FST0011|Preethi Bernadath|finance|09:45:00|09:52:00|6|420
2026-08-01|Sat|FS0404|Prem Shankar S|erp|10:17:00|10:17:00|0|0
2026-08-01|Sat|FS0105|Raghul Marimuthu|finance|09:45:00|10:29:00|44|2640
2026-08-01|Sat|FS0424|Rajesh Pannirselvame|cyber|08:52:00|09:22:00|30|1800
2026-08-01|Sat|FS0142|Rajesh Rajendran|dev|00:03:00|12:38:00|755|45300
2026-08-01|Sat|FS0398|Ranganathan C|erp|09:18:00|09:23:00|4|300
2026-08-01|Sat|FS0400|Rexlin Felix S|erp|09:35:00|09:35:00|0|0
2026-08-01|Sat|FS0023|Sakthivel M|erp|11:16:00|11:16:00|0|0
2026-08-01|Sat|FS0079|Sakthivel Mageshwaran|cyber|10:15:00|10:45:00|30|1800
2026-08-01|Sat|FS0409|Sanjay Boopathy M|finance|10:21:00|21:06:00|644|38700
2026-08-01|Sat|FS0442|Santhoshkumar Palanichamy|dev|09:46:00|10:01:00|15|900
2026-08-01|Sat|FS0334|Sarathi S S|testing|09:45:00|10:12:00|26|1620
2026-08-01|Sat|FS0106|Saravanan Devendhiran|dev|09:12:00|09:27:00|15|900
2026-08-01|Sat|FS0148|Selvaprakash Balan|dev|09:20:00|09:25:00|5|300
2026-08-01|Sat|FS0215|Shanmugam Mohanasundaram|dev|09:20:00|09:24:00|4|240
2026-08-01|Sat|FS0391|Shashwath Pasupathi|erp|10:01:00|10:05:00|4|240
2026-08-01|Sat|FS0324|Sowmya Prabhu|testing|09:57:00|10:02:00|4|300
2026-08-01|Sat|FS0423|Sri Cibi Sivakumar|cyber|09:24:00|09:30:00|5|360
2026-08-01|Sat|FS0329|Sridhar Kumar S|erp|09:11:00|09:17:00|5|360
2026-08-01|Sat|FS0333|Theeban Babu S|dev|08:28:00|08:33:00|4|300
2026-08-01|Sat|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:05:00|10:35:00|30|1800
2026-08-01|Sat|FS0291|Vicky  Kumar|erp|09:55:00|14:12:00|257|15420
2026-08-01|Sat|FS0302|Vignesh  Babu|cyber|07:40:00|08:10:00|30|1800
2026-08-01|Sat|FS0325|Vijay Prakash A|testing|10:06:00|02:54:00|1007|60480
2026-08-01|Sat|FS0353|Vishal Jayaraman|cyber|10:04:00|10:34:00|30|1800
2026-08-01|Sat|FS0294|Yamuna  M|dev|11:09:00|11:24:00|15|900
2026-08-01|Sat|FS0408|Yogeshwaran Govindaraj|erp|09:14:00|09:14:00|0|0
2026-08-01|Sat|FS0090|Yogeswaran Murugavel|cyber|09:57:00|10:27:00|30|1800
2026-08-02|Sun|FS0287|Nedunchezhiyan  M|dev|00:12:00|00:27:00|15|900
2026-08-02|Sun|FS0089|Yogeshwaran Chandrakasan|dev|01:21:00|01:36:00|15|900
2026-08-03|Mon|FS0439|Abinesh Nagarajan|devops|09:41:00|09:56:00|15|900
2026-08-03|Mon|FS0190|Anurag Virendrakumar|devops|09:27:00|09:42:00|15|900
2026-08-03|Mon|FS0018|Asmath Nisha|finance|10:00:00|10:33:00|33|1980
2026-08-03|Mon|FS0426|Astin Ravi|cyber|09:49:00|10:19:00|30|1800
2026-08-03|Mon|FS0049|Balaji|dev|10:24:00|10:39:00|15|900
2026-08-03|Mon|FS0193|Bharath Selvam|data|09:30:00|09:50:00|20|1200
2026-08-03|Mon|FS0277|Deepesh Raj B|dev|10:36:00|10:51:00|15|900
2026-08-03|Mon|FS0243|DELLIBABU T|finance|09:45:00|10:15:00|30|1800
2026-08-03|Mon|FS0281|Dhanalakshmi S|dev|09:18:00|09:25:00|6|420
2026-08-03|Mon|FS0101|Dhiwan Mariappan|finance|07:55:00|08:25:00|30|1800
2026-08-03|Mon|FC0002|Dileep Thammana|finance|09:30:00|09:40:00|9|600
2026-08-03|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:22:00|10:22:00|0|0
2026-08-03|Mon|FS0161|Haridha Muruganantham|erp|09:33:00|09:33:00|0|0
2026-08-03|Mon|FS0343|Hariharan Vijayakumar|erp|09:23:00|16:04:00|401|24060
2026-08-03|Mon|FS0425|Jayachandran Iswaran|cyber|09:56:00|10:33:00|36|2220
2026-08-03|Mon|FS0237|JONES  KAPIL L|testing|09:45:00|10:30:00|45|2700
2026-08-03|Mon|FST0013|Kalashree A|finance|09:45:00|10:19:00|34|2040
2026-08-03|Mon|FS0289|Kantha  Kumar K|dev|08:59:00|09:14:00|15|900
2026-08-03|Mon|FS0200|Kavinkumar Ramasamy|dev|09:45:00|10:05:00|20|1200
2026-08-03|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|08:22:00|08:47:00|25|1500
2026-08-03|Mon|FS0323|Kishore M|devops|09:30:00|09:37:00|7|420
2026-08-03|Mon|FS0158|Kishore Theiveekan|dev|09:49:00|10:03:00|14|840
2026-08-03|Mon|FS0039|Kumaresan Krishnan|finance|09:30:00|09:50:00|20|1200
2026-08-03|Mon|FS0126|Lakshmi Prasanna U|admin|10:28:00|10:28:00|0|0
2026-08-03|Mon|FS0437|Lenci Manuela L|it support|09:51:00|09:51:00|0|0
2026-08-03|Mon|FS0326|Mahasri Seenivasan|data|09:33:00|09:39:00|5|360
2026-08-03|Mon|FS0135|MAHESH T|cyber|09:45:00|09:57:00|11|720
2026-08-03|Mon|FS0133|maruthupandiyan mathuraiveeran|dev|09:45:00|10:10:00|25|1500
2026-08-03|Mon|FS0076|Meena Rajendran|testing|09:30:00|10:12:00|41|2520
2026-08-03|Mon|FS0063|Meenakshi Priya|finance|11:05:00|11:35:00|30|1800
2026-08-03|Mon|FS0427|Mukesh Muthusamy|cyber|09:34:00|10:04:00|30|1800
2026-08-03|Mon|FS0298|Nantha Guru|dev|09:45:00|09:57:00|11|720
2026-08-03|Mon|FS0390|Naveen Prasad Moorthy|dev|08:59:00|09:05:00|6|360
2026-08-03|Mon|FS0287|Nedunchezhiyan  M|dev|08:40:00|08:55:00|15|900
2026-08-03|Mon|FS0154|Nethaji Srinivasan|dev|09:45:00|10:07:00|22|1320
2026-08-03|Mon|FS0306|PRAKASH K|dev|08:51:00|09:06:00|15|900
2026-08-03|Mon|FS0322|Praveenkumar Saminathan|devops|10:31:00|10:46:00|15|900
2026-08-03|Mon|FS0209|Pravinabdulkalam Mathikannan|dev|11:10:00|12:12:00|61|3720
2026-08-03|Mon|FST0011|Preethi Bernadath|finance|10:44:00|11:14:00|30|1800
2026-08-03|Mon|FS0105|Raghul Marimuthu|finance|09:30:00|09:40:00|9|600
2026-08-03|Mon|FS0144|Ragul Priyan Murugan|dev|09:30:00|10:10:00|40|2400
2026-08-03|Mon|FS0424|Rajesh Pannirselvame|cyber|09:15:00|09:45:00|30|1800
2026-08-03|Mon|FS0142|Rajesh Rajendran|dev|09:30:00|09:43:00|13|780
2026-08-03|Mon|FS0347|Ramachandran M D|erp|09:45:00|09:45:00|0|0
2026-08-03|Mon|FS0398|Ranganathan C|erp|09:15:00|06:41:00|1285|77160
2026-08-03|Mon|FS0400|Rexlin Felix S|erp|09:46:00|09:46:00|0|0
2026-08-03|Mon|FS0023|Sakthivel M|erp|10:29:00|10:29:00|0|0
2026-08-03|Mon|FS0079|Sakthivel Mageshwaran|cyber|09:53:00|10:23:00|30|1800
2026-08-03|Mon|FS0438|Sangeetha Balasubramanian|testing|09:45:00|09:55:00|10|600
2026-08-03|Mon|FS0409|Sanjay Boopathy M|finance|10:02:00|16:31:00|389|23340
2026-08-03|Mon|FS0212|Santhosh Neelakandamoorthy|dev|09:36:00|09:51:00|15|900
2026-08-03|Mon|FS0106|Saravanan Devendhiran|dev|09:32:00|09:47:00|15|900
2026-08-03|Mon|FS0148|Selvaprakash Balan|dev|09:32:00|09:37:00|5|300
2026-08-03|Mon|FS0215|Shanmugam Mohanasundaram|dev|09:32:00|09:36:00|4|240
2026-08-03|Mon|FS0022|Shashti Priyan shathiyavelu|design|08:55:00|08:55:00|0|0
2026-08-03|Mon|FS0037|Sivashankaran P|dev|09:05:00|09:20:00|15|900
2026-08-03|Mon|FS0038|Sooriya Balaji Iyappan|dev|08:17:00|08:32:00|15|900
2026-08-03|Mon|FS0324|Sowmya Prabhu|testing|10:02:00|10:07:00|5|300
2026-08-03|Mon|FS0423|Sri Cibi Sivakumar|cyber|09:32:00|09:38:00|6|360
2026-08-03|Mon|FS0329|Sridhar Kumar S|erp|09:34:00|09:39:00|5|300
2026-08-03|Mon|FS0318|Suresh Babu S|testing|09:45:00|10:23:00|38|2280
2026-08-03|Mon|FS0085|Suryapriya Saravanan|dev|11:13:00|11:28:00|15|900
2026-08-03|Mon|FS0430|Syed Riyas Niyas|cyber|10:15:00|10:43:00|28|1680
2026-08-03|Mon|FS0333|Theeban Babu S|dev|08:59:00|09:14:00|15|900
2026-08-03|Mon|FS0040|Veeravel Devaraj|ml|09:30:00|10:09:00|39|2340
2026-08-03|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|09:53:00|10:23:00|30|1800
2026-08-03|Mon|FS0291|Vicky  Kumar|erp|09:36:00|09:42:00|5|360
2026-08-03|Mon|FS0302|Vignesh  Babu|cyber|08:43:00|09:13:00|30|1800
2026-08-03|Mon|FS0325|Vijay Prakash A|testing|09:59:00|03:49:00|1069|64200
2026-08-03|Mon|FS0239|VIJAY S R|testing|09:30:00|10:02:00|31|1920
2026-08-03|Mon|FS0353|Vishal Jayaraman|cyber|10:11:00|10:41:00|30|1800
2026-08-03|Mon|FS0035|Vivek I|cyber|10:29:00|10:59:00|30|1800
2026-08-03|Mon|FS0294|Yamuna  M|dev|09:45:00|09:50:00|4|300
2026-08-03|Mon|FS0089|Yogeshwaran Chandrakasan|dev|05:48:00|06:03:00|15|900
2026-08-03|Mon|FS0408|Yogeshwaran Govindaraj|erp|09:57:00|09:57:00|0|0
2026-08-03|Mon|FS0090|Yogeswaran Murugavel|cyber|09:57:00|10:27:00|30|1800
2026-08-04|Tue|FS0439|Abinesh Nagarajan|devops|09:55:00|10:10:00|15|900
2026-08-04|Tue|FS0152|Ajith Kumar Ramalingam|dev|09:30:00|10:12:00|41|2520
2026-08-04|Tue|FS0190|Anurag Virendrakumar|devops|09:26:00|09:41:00|15|900
2026-08-04|Tue|FS0426|Astin Ravi|cyber|09:19:00|09:49:00|30|1800
2026-08-04|Tue|FS0050|Avinash Pandian|cyber|06:16:00|06:46:00|30|1800
2026-08-04|Tue|FS0049|Balaji|dev|10:12:00|10:27:00|15|900
2026-08-04|Tue|FS0377|Daniel Raj N|it support|09:56:00|10:37:00|41|2460
2026-08-04|Tue|FS0195|David Mariyajebamalai|dev|10:55:00|11:02:00|6|420
2026-08-04|Tue|FS0277|Deepesh Raj B|dev|10:45:00|11:00:00|15|900
2026-08-04|Tue|FS0243|DELLIBABU T|finance|09:52:00|10:22:00|30|1800
2026-08-04|Tue|FS0281|Dhanalakshmi S|dev|09:26:00|09:32:00|5|360
2026-08-04|Tue|FS0046|Divya Priya Senthilkumaran|pm|10:00:00|10:00:00|0|0
2026-08-04|Tue|FS0073|Gokulakannan Selvam|design|10:21:00|08:15:00|1313|78840
2026-08-04|Tue|FS0161|Haridha Muruganantham|erp|09:39:00|09:39:00|0|0
2026-08-04|Tue|FS0343|Hariharan Vijayakumar|erp|09:38:00|00:31:00|892|53580
2026-08-04|Tue|FS0425|Jayachandran Iswaran|cyber|09:30:00|09:39:00|8|540
2026-08-04|Tue|FS0237|JONES  KAPIL L|testing|10:34:00|11:04:00|30|1800
2026-08-04|Tue|FST0013|Kalashree A|finance|09:45:00|10:03:00|17|1080
2026-08-04|Tue|FS0289|Kantha  Kumar K|dev|08:49:00|14:38:00|348|20940
2026-08-04|Tue|FS0150|Karthikesan RajaRaman|dev|09:45:00|10:15:00|29|1800
2026-08-04|Tue|FS0200|Kavinkumar Ramasamy|dev|09:30:00|09:41:00|10|660
2026-08-04|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|08:51:00|09:01:00|10|600
2026-08-04|Tue|FS0397|Kishore Chandran|erp|09:27:00|09:27:00|0|0
2026-08-04|Tue|FS0323|Kishore M|devops|11:12:00|11:17:00|4|300
2026-08-04|Tue|FS0158|Kishore Theiveekan|dev|09:45:00|10:03:00|18|1080
2026-08-04|Tue|FS0039|Kumaresan Krishnan|finance|09:30:00|10:14:00|44|2640
2026-08-04|Tue|FS0126|Lakshmi Prasanna U|admin|11:07:00|11:07:00|0|0
2026-08-04|Tue|FS0437|Lenci Manuela L|it support|10:40:00|16:12:00|331|19920
2026-08-04|Tue|FST0022|Madhumitha Chandrasekaran|finance|09:47:00|10:17:00|30|1800
2026-08-04|Tue|FS0339|Magesh Kumar|cyber|09:51:00|09:57:00|6|360
2026-08-04|Tue|FS0326|Mahasri Seenivasan|data|09:51:00|09:56:00|5|300
2026-08-04|Tue|FS0135|MAHESH T|cyber|00:07:00|00:37:00|30|1800
2026-08-04|Tue|FS0297|Maruthan G|dev|00:58:00|01:13:00|15|900
2026-08-04|Tue|FS0076|Meena Rajendran|testing|11:28:00|11:58:00|30|1800
2026-08-04|Tue|FS0063|Meenakshi Priya|finance|09:45:00|10:20:00|35|2100
2026-08-04|Tue|FS0427|Mukesh Muthusamy|cyber|09:45:00|10:31:00|45|2760
2026-08-04|Tue|FS0298|Nantha Guru|dev|11:24:00|11:36:00|12|720
2026-08-04|Tue|FS0390|Naveen Prasad Moorthy|dev|09:00:00|09:05:00|5|300
2026-08-04|Tue|FS0287|Nedunchezhiyan  M|dev|00:59:00|01:14:00|15|900
2026-08-04|Tue|FS0154|Nethaji Srinivasan|dev|09:45:00|10:28:00|42|2580
2026-08-04|Tue|FS0321|Nithyanantham V|devops|09:06:00|09:21:00|15|900
2026-08-04|Tue|FS0306|PRAKASH K|dev|09:06:00|09:21:00|15|900
2026-08-04|Tue|FS0322|Praveenkumar Saminathan|devops|10:37:00|10:52:00|15|900
2026-08-04|Tue|FS0209|Pravinabdulkalam Mathikannan|dev|10:05:00|10:15:00|9|600
2026-08-04|Tue|FST0011|Preethi Bernadath|finance|09:30:00|09:33:00|3|180
2026-08-04|Tue|FS0404|Prem Shankar S|erp|11:24:00|11:24:00|0|0
2026-08-04|Tue|FS0405|Ragavendraprasath G|erp|10:02:00|10:02:00|0|0
2026-08-04|Tue|FS0105|Raghul Marimuthu|finance|09:45:00|09:54:00|9|540
2026-08-04|Tue|FS0144|Ragul Priyan Murugan|dev|09:58:00|10:13:00|15|900
2026-08-04|Tue|FS0331|Rajesh Kumar A|testing|11:24:00|11:54:00|30|1800
2026-08-04|Tue|FS0424|Rajesh Pannirselvame|cyber|09:19:00|09:49:00|30|1800
2026-08-04|Tue|FS0398|Ranganathan C|erp|09:26:00|04:09:00|1123|67380
2026-08-04|Tue|FS0400|Rexlin Felix S|erp|09:47:00|09:47:00|0|0
2026-08-04|Tue|FS0023|Sakthivel M|erp|10:27:00|10:27:00|0|0
2026-08-04|Tue|FS0079|Sakthivel Mageshwaran|cyber|10:10:00|10:40:00|30|1800
2026-08-04|Tue|FS0438|Sangeetha Balasubramanian|testing|09:42:00|09:46:00|4|240
2026-08-04|Tue|FS0409|Sanjay Boopathy M|finance|10:20:00|03:29:00|1028|61740
2026-08-04|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:45:00|13:40:00|235|14100
2026-08-04|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:51:00|10:06:00|15|900
2026-08-04|Tue|FS0334|Sarathi S S|testing|09:30:00|10:12:00|42|2520
2026-08-04|Tue|FS0031|Saravana Pandian S|design|11:00:00|11:00:00|0|0
2026-08-04|Tue|FS0106|Saravanan Devendhiran|dev|09:03:00|09:18:00|15|900
2026-08-04|Tue|FS0148|Selvaprakash Balan|dev|09:36:00|09:41:00|5|300
2026-08-04|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:36:00|09:40:00|4|240
2026-08-04|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:59:00|09:59:00|0|0
2026-08-04|Tue|FS0391|Shashwath Pasupathi|erp|10:02:00|10:08:00|5|360
2026-08-04|Tue|FS0037|Sivashankaran P|dev|09:03:00|09:18:00|15|900
2026-08-04|Tue|FS0038|Sooriya Balaji Iyappan|dev|00:39:00|00:54:00|15|900
2026-08-04|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:26:00|09:56:00|30|1800
2026-08-04|Tue|FS0329|Sridhar Kumar S|erp|09:21:00|09:21:00|0|0
2026-08-04|Tue|FS0428|Sriganth Chennan|cyber|10:10:00|10:40:00|30|1800
2026-08-04|Tue|FS0318|Suresh Babu S|testing|09:56:00|01:57:00|961|57660
2026-08-04|Tue|FS0085|Suryapriya Saravanan|dev|11:25:00|11:40:00|15|900
2026-08-04|Tue|FS0430|Syed Riyas Niyas|cyber|09:58:00|14:53:00|295|17700
2026-08-04|Tue|FS0040|Veeravel Devaraj|ml|00:14:00|00:29:00|15|900
2026-08-04|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:21:00|10:51:00|30|1800
2026-08-04|Tue|FS0291|Vicky  Kumar|erp|09:45:00|09:51:00|5|360
2026-08-04|Tue|FS0302|Vignesh  Babu|cyber|08:55:00|09:25:00|30|1800
2026-08-04|Tue|FS0325|Vijay Prakash A|testing|10:15:00|03:17:00|1022|61320
2026-08-04|Tue|FS0353|Vishal Jayaraman|cyber|10:54:00|11:24:00|30|1800
2026-08-04|Tue|FS0035|Vivek I|cyber|09:30:00|09:33:00|2|180
2026-08-04|Tue|FS0294|Yamuna  M|dev|09:30:00|10:05:00|34|2100
2026-08-04|Tue|FS0089|Yogeshwaran Chandrakasan|dev|00:58:00|01:13:00|15|900
2026-08-04|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:51:00|09:51:00|0|0
2026-08-04|Tue|FS0090|Yogeswaran Murugavel|cyber|10:27:00|10:57:00|30|1800
2026-08-05|Wed|FS0439|Abinesh Nagarajan|devops|10:04:00|10:19:00|15|900
2026-08-05|Wed|FS0414|Adam Gil Christ|it support|10:36:00|10:48:00|11|720
2026-08-05|Wed|FS0342|Ashraf A|testing|09:45:00|10:11:00|25|1560
2026-08-05|Wed|FS0426|Astin Ravi|cyber|09:53:00|10:23:00|30|1800
2026-08-05|Wed|FS0050|Avinash Pandian|cyber|07:36:00|08:06:00|30|1800
2026-08-05|Wed|FS0049|Balaji|dev|09:46:00|10:01:00|15|900
2026-08-05|Wed|FS0188|Bharadwaj Kalathur Vadyar|finance|09:30:00|09:58:00|27|1680
2026-08-05|Wed|FS0194|Bharathi Arjunan|dev|09:45:00|09:53:00|8|480
2026-08-05|Wed|FS0377|Daniel Raj N|it support|10:22:00|10:27:00|5|300
2026-08-05|Wed|FS0195|David Mariyajebamalai|dev|09:45:00|10:25:00|40|2400
2026-08-05|Wed|FS0277|Deepesh Raj B|dev|10:26:00|10:41:00|15|900
2026-08-05|Wed|FS0243|DELLIBABU T|finance|09:27:00|09:57:00|30|1800
2026-08-05|Wed|FS0281|Dhanalakshmi S|dev|09:29:00|09:37:00|7|480
2026-08-05|Wed|FS0101|Dhiwan Mariappan|finance|07:55:00|08:25:00|30|1800
2026-08-05|Wed|FC0002|Dileep Thammana|finance|10:36:00|11:06:00|30|1800
2026-08-05|Wed|FS0046|Divya Priya Senthilkumaran|pm|10:59:00|10:59:00|0|0
2026-08-05|Wed|FS0311|Ganesh D|design|09:30:00|09:58:00|27|1680
2026-08-05|Wed|FS0073|Gokulakannan Selvam|design|08:01:00|08:08:00|7|420
2026-08-05|Wed|FS0161|Haridha Muruganantham|erp|09:35:00|09:35:00|0|0
2026-08-05|Wed|FS0343|Hariharan Vijayakumar|erp|09:56:00|01:20:00|923|55440
2026-08-05|Wed|FS0399|Harthesh Murugan|finance|09:01:00|09:31:00|30|1800
2026-08-05|Wed|FS0036|Jai Surya S|design|09:33:00|09:58:00|24|1500
2026-08-05|Wed|FS0338|Jairaam S|testing|09:30:00|09:59:00|28|1740
2026-08-05|Wed|FS0350|Janaki L|testing|09:30:00|10:03:00|32|1980
2026-08-05|Wed|FS0237|JONES  KAPIL L|testing|10:39:00|11:09:00|30|1800
2026-08-05|Wed|FST0013|Kalashree A|finance|11:26:00|00:00:00|753|45240
2026-08-05|Wed|FS0289|Kantha  Kumar K|dev|09:25:00|09:29:00|4|240
2026-08-05|Wed|FS0150|Karthikesan RajaRaman|dev|09:45:00|10:22:00|37|2220
2026-08-05|Wed|FS0200|Kavinkumar Ramasamy|dev|10:06:00|10:21:00|15|900
2026-08-05|Wed|FS0397|Kishore Chandran|erp|08:31:00|08:31:00|0|0
2026-08-05|Wed|FS0323|Kishore M|devops|09:45:00|09:55:00|10|600
2026-08-05|Wed|FS0158|Kishore Theiveekan|dev|09:34:00|09:49:00|14|900
2026-08-05|Wed|FS0039|Kumaresan Krishnan|finance|09:45:00|10:08:00|22|1380
2026-08-05|Wed|FS0126|Lakshmi Prasanna U|admin|10:24:00|10:24:00|0|0
2026-08-05|Wed|FS0437|Lenci Manuela L|it support|10:23:00|10:31:00|8|480
2026-08-05|Wed|FS0174|magesh jayakumar|finance|09:05:00|09:35:00|30|1800
2026-08-05|Wed|FS0339|Magesh Kumar|cyber|09:55:00|10:29:00|33|2040
2026-08-05|Wed|FS0326|Mahasri Seenivasan|data|09:40:00|10:03:00|23|1380
2026-08-05|Wed|FS0135|MAHESH T|cyber|03:10:00|03:40:00|30|1800
2026-08-05|Wed|FS0297|Maruthan G|dev|09:30:00|09:54:00|23|1440
2026-08-05|Wed|FS0076|Meena Rajendran|testing|09:45:00|09:59:00|14|840
2026-08-05|Wed|FS0063|Meenakshi Priya|finance|07:17:00|07:47:00|30|1800
2026-08-05|Wed|FS0298|Nantha Guru|dev|09:30:00|10:15:00|44|2700
2026-08-05|Wed|FS0390|Naveen Prasad Moorthy|dev|08:14:00|08:19:00|5|300
2026-08-05|Wed|FS0287|Nedunchezhiyan  M|dev|01:16:00|01:31:00|15|900
2026-08-05|Wed|FS0321|Nithyanantham V|devops|09:11:00|09:26:00|15|900
2026-08-05|Wed|FS0306|PRAKASH K|dev|09:30:00|09:46:00|15|960
2026-08-05|Wed|FS0322|Praveenkumar Saminathan|devops|11:14:00|11:29:00|15|900
2026-08-05|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|10:25:00|11:28:00|62|3780
2026-08-05|Wed|FST0011|Preethi Bernadath|finance|11:00:00|11:30:00|30|1800
2026-08-05|Wed|FS0404|Prem Shankar S|erp|09:45:00|10:26:00|40|2460
2026-08-05|Wed|FS0405|Ragavendraprasath G|erp|09:36:00|09:36:00|0|0
2026-08-05|Wed|FS0105|Raghul Marimuthu|finance|00:42:00|01:12:00|30|1800
2026-08-05|Wed|FS0144|Ragul Priyan Murugan|dev|11:16:00|11:31:00|15|900
2026-08-05|Wed|FS0331|Rajesh Kumar A|testing|09:30:00|09:43:00|12|780
2026-08-05|Wed|FS0424|Rajesh Pannirselvame|cyber|08:56:00|09:26:00|30|1800
2026-08-05|Wed|FS0398|Ranganathan C|erp|09:19:00|09:24:00|4|300
2026-08-05|Wed|FS0400|Rexlin Felix S|erp|09:52:00|09:52:00|0|0
2026-08-05|Wed|FS0079|Sakthivel Mageshwaran|cyber|10:18:00|10:48:00|30|1800
2026-08-05|Wed|FS0438|Sangeetha Balasubramanian|testing|09:36:00|09:41:00|4|300
2026-08-05|Wed|FS0409|Sanjay Boopathy M|finance|10:36:00|00:01:00|804|48300
2026-08-05|Wed|FS0212|Santhosh Neelakandamoorthy|dev|09:53:00|09:58:00|4|300
2026-08-05|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:43:00|09:58:00|15|900
2026-08-05|Wed|FS0031|Saravana Pandian S|design|09:45:00|09:47:00|2|120
2026-08-05|Wed|FS0106|Saravanan Devendhiran|dev|09:52:00|10:07:00|15|900
2026-08-05|Wed|FS0231|Saritha Sekar|risk|10:42:00|10:42:00|0|0
2026-08-05|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:46:00|09:46:00|0|0
2026-08-05|Wed|FS0391|Shashwath Pasupathi|erp|09:58:00|09:58:00|0|0
2026-08-05|Wed|FS0038|Sooriya Balaji Iyappan|dev|00:08:00|00:23:00|15|900
2026-08-05|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:27:00|09:57:00|30|1800
2026-08-05|Wed|FS0329|Sridhar Kumar S|erp|09:22:00|09:22:00|0|0
2026-08-05|Wed|FS0428|Sriganth Chennan|cyber|10:11:00|10:41:00|30|1800
2026-08-05|Wed|FS0318|Suresh Babu S|testing|09:27:00|02:37:00|1030|61800
2026-08-05|Wed|FS0085|Suryapriya Saravanan|dev|09:45:00|10:27:00|41|2520
2026-08-05|Wed|FS0430|Syed Riyas Niyas|cyber|09:52:00|01:14:00|921|55320
2026-08-05|Wed|FS0333|Theeban Babu S|dev|08:14:00|08:29:00|15|900
2026-08-05|Wed|FS0040|Veeravel Devaraj|ml|01:28:00|01:43:00|15|900
2026-08-05|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:11:00|10:41:00|30|1800
2026-08-05|Wed|FS0291|Vicky  Kumar|erp|09:46:00|09:46:00|0|0
2026-08-05|Wed|FS0302|Vignesh  Babu|cyber|08:14:00|08:44:00|30|1800
2026-08-05|Wed|FS0325|Vijay Prakash A|testing|10:04:00|02:59:00|1015|60900
2026-08-05|Wed|FS0353|Vishal Jayaraman|cyber|10:33:00|11:03:00|30|1800
2026-08-05|Wed|FS0089|Yogeshwaran Chandrakasan|dev|01:53:00|02:08:00|15|900
2026-08-05|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:20:00|09:20:00|0|0
2026-08-05|Wed|FS0090|Yogeswaran Murugavel|cyber|10:23:00|10:53:00|30|1800
2026-08-06|Thu|FS0439|Abinesh Nagarajan|devops|10:00:00|10:15:00|15|900
2026-08-06|Thu|FS0414|Adam Gil Christ|it support|10:40:00|10:46:00|5|360
2026-08-06|Thu|FS0190|Anurag Virendrakumar|devops|09:24:00|09:39:00|15|900
2026-08-06|Thu|FS0342|Ashraf A|testing|01:14:00|00:02:00|1368|82080
2026-08-06|Thu|FS0018|Asmath Nisha|finance|10:05:00|10:10:00|4|300
2026-08-06|Thu|FS0426|Astin Ravi|cyber|09:16:00|09:46:00|30|1800
2026-08-06|Thu|FS0050|Avinash Pandian|cyber|00:23:00|00:53:00|30|1800
2026-08-06|Thu|FS0049|Balaji|dev|10:30:00|10:45:00|15|900
2026-08-06|Thu|FS0194|Bharathi Arjunan|dev|09:40:00|10:05:00|25|1500
2026-08-06|Thu|FS0377|Daniel Raj N|it support|10:07:00|03:57:00|1070|64200
2026-08-06|Thu|FS0195|David Mariyajebamalai|dev|09:45:00|10:11:00|26|1560
2026-08-06|Thu|FS0277|Deepesh Raj B|dev|09:45:00|09:49:00|4|240
2026-08-06|Thu|FS0243|DELLIBABU T|finance|09:26:00|09:56:00|30|1800
2026-08-06|Thu|FS0281|Dhanalakshmi S|dev|09:36:00|09:40:00|4|240
2026-08-06|Thu|FS0101|Dhiwan Mariappan|finance|07:44:00|08:14:00|30|1800
2026-08-06|Thu|FC0002|Dileep Thammana|finance|11:05:00|11:35:00|30|1800
2026-08-06|Thu|FS0046|Divya Priya Senthilkumaran|pm|10:12:00|10:12:00|0|0
2026-08-06|Thu|FS0311|Ganesh D|design|09:45:00|10:16:00|31|1860
2026-08-06|Thu|FS0073|Gokulakannan Selvam|design|10:00:00|10:05:00|4|300
2026-08-06|Thu|FS0161|Haridha Muruganantham|erp|09:40:00|09:40:00|0|0
2026-08-06|Thu|FS0343|Hariharan Vijayakumar|erp|09:50:00|00:08:00|857|51480
2026-08-06|Thu|FS0399|Harthesh Murugan|finance|09:21:00|09:51:00|30|1800
2026-08-06|Thu|FS0036|Jai Surya S|design|10:08:00|10:20:00|12|720
2026-08-06|Thu|FS0338|Jairaam S|testing|09:45:00|09:53:00|8|480
2026-08-06|Thu|FS0350|Janaki L|testing|09:30:00|09:50:00|20|1200
2026-08-06|Thu|FS0237|JONES  KAPIL L|testing|10:36:00|11:06:00|30|1800
2026-08-06|Thu|FST0013|Kalashree A|finance|09:30:00|10:09:00|39|2340
2026-08-06|Thu|FS0150|Karthikesan RajaRaman|dev|09:45:00|09:45:00|0|0
2026-08-06|Thu|FS0200|Kavinkumar Ramasamy|dev|09:45:00|09:53:00|8|480
2026-08-06|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|08:52:00|09:04:00|12|720
2026-08-06|Thu|FS0397|Kishore Chandran|erp|08:49:00|08:49:00|0|0
2026-08-06|Thu|FS0323|Kishore M|devops|11:04:00|11:08:00|4|240
2026-08-06|Thu|FS0158|Kishore Theiveekan|dev|09:31:00|09:46:00|14|900
2026-08-06|Thu|FS0039|Kumaresan Krishnan|finance|03:02:00|03:32:00|30|1800
2026-08-06|Thu|FS0126|Lakshmi Prasanna U|admin|10:44:00|10:44:00|0|0
2026-08-06|Thu|FST0022|Madhumitha Chandrasekaran|finance|09:47:00|10:17:00|30|1800
2026-08-06|Thu|FS0339|Magesh Kumar|cyber|10:03:00|10:08:00|4|300
2026-08-06|Thu|FS0135|MAHESH T|cyber|04:07:00|04:37:00|30|1800
2026-08-06|Thu|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|10:03:00|33|1980
2026-08-06|Thu|FS0390|Naveen Prasad Moorthy|dev|09:09:00|09:14:00|5|300
2026-08-06|Thu|FS0287|Nedunchezhiyan  M|dev|00:22:00|00:37:00|15|900
2026-08-06|Thu|FS0321|Nithyanantham V|devops|08:56:00|09:11:00|15|900
2026-08-06|Thu|FS0306|PRAKASH K|dev|09:06:00|09:21:00|15|900
2026-08-06|Thu|FS0322|Praveenkumar Saminathan|devops|11:24:00|11:39:00|15|900
2026-08-06|Thu|FST0011|Preethi Bernadath|finance|10:54:00|11:24:00|30|1800
2026-08-06|Thu|FS0405|Ragavendraprasath G|erp|09:59:00|09:59:00|0|0
2026-08-06|Thu|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:03:00|18|1080
2026-08-06|Thu|FS0424|Rajesh Pannirselvame|cyber|09:16:00|09:46:00|30|1800
2026-08-06|Thu|FS0398|Ranganathan C|erp|09:34:00|09:38:00|4|240
2026-08-06|Thu|FS0400|Rexlin Felix S|erp|09:51:00|09:51:00|0|0
2026-08-06|Thu|FS0079|Sakthivel Mageshwaran|cyber|00:33:00|01:03:00|30|1800
2026-08-06|Thu|FS0438|Sangeetha Balasubramanian|testing|09:36:00|09:40:00|4|240
2026-08-06|Thu|FS0409|Sanjay Boopathy M|finance|10:40:00|02:36:00|956|57360
2026-08-06|Thu|FS0212|Santhosh Neelakandamoorthy|dev|09:53:00|09:58:00|4|300
2026-08-06|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:53:00|10:08:00|15|900
2026-08-06|Thu|FS0334|Sarathi S S|testing|10:33:00|11:03:00|30|1800
2026-08-06|Thu|FS0031|Saravana Pandian S|design|11:07:00|11:07:00|0|0
2026-08-06|Thu|FS0106|Saravanan Devendhiran|dev|10:00:00|10:15:00|15|900
2026-08-06|Thu|FS0130|Sathish Kumar Stalin|finance|09:30:00|10:12:00|41|2520
2026-08-06|Thu|FS0148|Selvaprakash Balan|dev|09:22:00|09:28:00|5|360
2026-08-06|Thu|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|10:01:00|16|960
2026-08-06|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:22:00|09:27:00|4|300
2026-08-06|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:24:00|09:24:00|0|0
2026-08-06|Thu|FS0391|Shashwath Pasupathi|erp|09:35:00|09:35:00|0|0
2026-08-06|Thu|FS0038|Sooriya Balaji Iyappan|dev|09:30:00|10:05:00|34|2100
2026-08-06|Thu|FS0324|Sowmya Prabhu|testing|09:48:00|00:36:00|888|53280
2026-08-06|Thu|FS0423|Sri Cibi Sivakumar|cyber|09:22:00|09:52:00|30|1800
2026-08-06|Thu|FS0329|Sridhar Kumar S|erp|09:21:00|09:21:00|0|0
2026-08-06|Thu|FS0428|Sriganth Chennan|cyber|10:08:00|10:38:00|30|1800
2026-08-06|Thu|FS0318|Suresh Babu S|testing|10:20:00|01:19:00|899|53940
2026-08-06|Thu|FS0085|Suryapriya Saravanan|dev|11:18:00|11:33:00|15|900
2026-08-06|Thu|FS0430|Syed Riyas Niyas|cyber|00:17:00|00:01:00|1423|85440
2026-08-06|Thu|FS0333|Theeban Babu S|dev|09:09:00|09:24:00|15|900
2026-08-06|Thu|FS0040|Veeravel Devaraj|ml|08:33:00|08:48:00|15|900
2026-08-06|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:18:00|10:48:00|30|1800
2026-08-06|Thu|FS0291|Vicky  Kumar|erp|09:47:00|09:47:00|0|0
2026-08-06|Thu|FS0325|Vijay Prakash A|testing|10:20:00|01:23:00|903|54180
2026-08-06|Thu|FS0353|Vishal Jayaraman|cyber|10:25:00|10:55:00|30|1800
2026-08-06|Thu|FS0035|Vivek I|cyber|09:30:00|09:48:00|18|1080
2026-08-06|Thu|FS0089|Yogeshwaran Chandrakasan|dev|11:07:00|11:22:00|15|900
2026-08-06|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:31:00|09:31:00|0|0
2026-08-06|Thu|FS0090|Yogeswaran Murugavel|cyber|09:45:00|09:55:00|9|600
2026-08-07|Fri|FS0439|Abinesh Nagarajan|devops|09:56:00|10:11:00|15|900
2026-08-07|Fri|FS0414|Adam Gil Christ|it support|10:01:00|00:27:00|865|51960
2026-08-07|Fri|FS0342|Ashraf A|testing|00:53:00|00:05:00|1391|83520
2026-08-07|Fri|FS0050|Avinash Pandian|cyber|08:38:00|09:08:00|30|1800
2026-08-07|Fri|FS0049|Balaji|dev|10:11:00|10:26:00|15|900
2026-08-07|Fri|FS0194|Bharathi Arjunan|dev|09:51:00|10:03:00|11|720
2026-08-07|Fri|FS0377|Daniel Raj N|it support|08:48:00|08:48:00|0|0
2026-08-07|Fri|FS0195|David Mariyajebamalai|dev|09:30:00|09:35:00|5|300
2026-08-07|Fri|FS0277|Deepesh Raj B|dev|11:16:00|11:31:00|15|900
2026-08-07|Fri|FS0281|Dhanalakshmi S|dev|09:25:00|09:30:00|5|300
2026-08-07|Fri|FC0002|Dileep Thammana|finance|10:33:00|11:03:00|30|1800
2026-08-07|Fri|FS0046|Divya Priya Senthilkumaran|pm|10:46:00|10:46:00|0|0
2026-08-07|Fri|FS0073|Gokulakannan Selvam|design|08:14:00|08:21:00|7|420
2026-08-07|Fri|FS0161|Haridha Muruganantham|erp|10:14:00|10:14:00|0|0
2026-08-07|Fri|FS0343|Hariharan Vijayakumar|erp|09:37:00|00:35:00|898|53880
2026-08-07|Fri|FS0399|Harthesh Murugan|finance|09:01:00|09:31:00|30|1800
2026-08-07|Fri|FS0036|Jai Surya S|design|10:06:00|10:13:00|7|420
2026-08-07|Fri|FS0350|Janaki L|testing|09:30:00|10:01:00|30|1860
2026-08-07|Fri|FS0237|JONES  KAPIL L|testing|10:36:00|11:06:00|30|1800
2026-08-07|Fri|FS0433|keerthivaasen.v@finstein.ai|cyber|09:00:00|09:09:00|9|540
2026-08-07|Fri|FS0397|Kishore Chandran|erp|08:39:00|08:39:00|0|0
2026-08-07|Fri|FS0323|Kishore M|devops|10:04:00|00:05:00|841|50460
2026-08-07|Fri|FS0158|Kishore Theiveekan|dev|10:27:00|10:41:00|14|840
2026-08-07|Fri|FS0126|Lakshmi Prasanna U|admin|09:45:00|10:19:00|33|2040
2026-08-07|Fri|FS0437|Lenci Manuela L|it support|10:38:00|10:48:00|9|600
2026-08-07|Fri|FST0022|Madhumitha Chandrasekaran|finance|08:38:00|09:08:00|30|1800
2026-08-07|Fri|FS0339|Magesh Kumar|cyber|09:54:00|09:59:00|5|300
2026-08-07|Fri|FS0135|MAHESH T|cyber|04:04:00|04:34:00|30|1800
2026-08-07|Fri|FS0133|maruthupandiyan mathuraiveeran|dev|02:38:00|02:53:00|15|900
2026-08-07|Fri|FS0076|Meena Rajendran|testing|09:45:00|10:29:00|43|2640
2026-08-07|Fri|FS0390|Naveen Prasad Moorthy|dev|09:06:00|09:11:00|4|300
2026-08-07|Fri|FS0287|Nedunchezhiyan  M|dev|01:19:00|01:34:00|15|900
2026-08-07|Fri|FS0321|Nithyanantham V|devops|09:44:00|09:59:00|15|900
2026-08-07|Fri|FS0306|PRAKASH K|dev|09:11:00|09:26:00|15|900
2026-08-07|Fri|FS0322|Praveenkumar Saminathan|devops|09:30:00|10:04:00|34|2040
2026-08-07|Fri|FS0209|Pravinabdulkalam Mathikannan|dev|10:33:00|10:52:00|19|1140
2026-08-07|Fri|FST0011|Preethi Bernadath|finance|10:52:00|11:22:00|30|1800
2026-08-07|Fri|FS0405|Ragavendraprasath G|erp|09:56:00|09:56:00|0|0
2026-08-07|Fri|FS0144|Ragul Priyan Murugan|dev|09:30:00|09:42:00|11|720
2026-08-07|Fri|FS0331|Rajesh Kumar A|testing|09:45:00|10:17:00|32|1920
2026-08-07|Fri|FS0424|Rajesh Pannirselvame|cyber|08:55:00|09:25:00|30|1800
2026-08-07|Fri|FS0347|Ramachandran M D|erp|09:46:00|09:46:00|0|0
2026-08-07|Fri|FS0398|Ranganathan C|erp|09:25:00|09:29:00|4|240
2026-08-07|Fri|FS0400|Rexlin Felix S|erp|10:08:00|10:08:00|0|0
2026-08-07|Fri|FS0079|Sakthivel Mageshwaran|cyber|09:30:00|10:05:00|34|2100
2026-08-07|Fri|FS0438|Sangeetha Balasubramanian|testing|09:35:00|09:39:00|4|240
2026-08-07|Fri|FS0409|Sanjay Boopathy M|finance|10:01:00|01:07:00|906|54360
2026-08-07|Fri|FS0212|Santhosh Neelakandamoorthy|dev|09:46:00|09:50:00|4|240
2026-08-07|Fri|FS0442|Santhoshkumar Palanichamy|dev|09:49:00|10:04:00|15|900
2026-08-07|Fri|FS0031|Saravana Pandian S|design|11:17:00|11:17:00|0|0
2026-08-07|Fri|FS0106|Saravanan Devendhiran|dev|10:28:00|10:43:00|15|900
2026-08-07|Fri|FS0231|Saritha Sekar|risk|10:37:00|10:37:00|0|0
2026-08-07|Fri|FS0148|Selvaprakash Balan|dev|09:31:00|08:49:00|1397|83880
2026-08-07|Fri|FS0215|Shanmugam Mohanasundaram|dev|09:31:00|09:37:00|6|360
2026-08-07|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:32:00|09:32:00|0|0
2026-08-07|Fri|FS0391|Shashwath Pasupathi|erp|09:47:00|09:47:00|0|0
2026-08-07|Fri|FS0038|Sooriya Balaji Iyappan|dev|05:36:00|05:51:00|15|900
2026-08-07|Fri|FS0324|Sowmya Prabhu|testing|09:55:00|00:46:00|891|53460
2026-08-07|Fri|FS0423|Sri Cibi Sivakumar|cyber|09:24:00|09:54:00|30|1800
2026-08-07|Fri|FS0329|Sridhar Kumar S|erp|09:09:00|09:09:00|0|0
2026-08-07|Fri|FS0428|Sriganth Chennan|cyber|10:06:00|10:36:00|30|1800
2026-08-07|Fri|FS0085|Suryapriya Saravanan|dev|11:05:00|11:20:00|15|900
2026-08-07|Fri|FS0430|Syed Riyas Niyas|cyber|10:43:00|10:58:00|15|900
2026-08-07|Fri|FS0333|Theeban Babu S|dev|09:06:00|09:21:00|15|900
2026-08-07|Fri|FS0040|Veeravel Devaraj|ml|00:53:00|01:08:00|15|900
2026-08-07|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:56:00|11:26:00|30|1800
2026-08-07|Fri|FS0291|Vicky  Kumar|erp|09:54:00|09:59:00|4|300
2026-08-07|Fri|FS0302|Vignesh  Babu|cyber|08:25:00|08:55:00|30|1800
2026-08-07|Fri|FS0325|Vijay Prakash A|testing|10:23:00|10:30:00|6|420
2026-08-07|Fri|FS0353|Vishal Jayaraman|cyber|10:12:00|10:42:00|30|1800
2026-08-07|Fri|FS0035|Vivek I|cyber|00:08:00|00:38:00|30|1800
2026-08-07|Fri|FS0294|Yamuna  M|dev|09:45:00|09:51:00|6|360
2026-08-07|Fri|FS0089|Yogeshwaran Chandrakasan|dev|00:04:00|00:19:00|15|900
2026-08-07|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:13:00|09:13:00|0|0
2026-08-07|Fri|FS0090|Yogeswaran Murugavel|cyber|09:54:00|10:24:00|30|1800
2026-08-08|Sat|FS0439|Abinesh Nagarajan|devops|10:09:00|10:24:00|15|900
2026-08-08|Sat|FS0414|Adam Gil Christ|it support|10:36:00|10:40:00|4|240
2026-08-08|Sat|FS0018|Asmath Nisha|finance|10:15:00|10:26:00|10|660
2026-08-08|Sat|FS0426|Astin Ravi|cyber|08:45:00|09:15:00|30|1800
2026-08-08|Sat|FS0050|Avinash Pandian|cyber|11:28:00|11:58:00|30|1800
2026-08-08|Sat|FS0049|Balaji|dev|11:24:00|11:39:00|15|900
2026-08-08|Sat|FS0194|Bharathi Arjunan|dev|09:47:00|09:54:00|6|420
2026-08-08|Sat|FS0377|Daniel Raj N|it support|10:08:00|10:08:00|0|0
2026-08-08|Sat|FS0195|David Mariyajebamalai|dev|10:11:00|10:19:00|8|480
2026-08-08|Sat|FS0277|Deepesh Raj B|dev|10:48:00|11:03:00|15|900
2026-08-08|Sat|FS0243|DELLIBABU T|finance|09:26:00|09:56:00|30|1800
2026-08-08|Sat|FS0281|Dhanalakshmi S|dev|09:27:00|04:40:00|1153|69180
2026-08-08|Sat|FC0002|Dileep Thammana|finance|09:45:00|09:58:00|12|780
2026-08-08|Sat|FS0046|Divya Priya Senthilkumaran|pm|10:21:00|10:21:00|0|0
2026-08-08|Sat|FS0319|Gokulakannan Duraisamy|ml|09:45:00|10:31:00|45|2760
2026-08-08|Sat|FS0073|Gokulakannan Selvam|design|07:56:00|08:01:00|5|300
2026-08-08|Sat|FS0343|Hariharan Vijayakumar|erp|09:35:00|00:50:00|915|54900
2026-08-08|Sat|FS0399|Harthesh Murugan|finance|09:30:00|10:00:00|30|1800
2026-08-08|Sat|FS0036|Jai Surya S|design|08:27:00|08:33:00|5|360
2026-08-08|Sat|FS0338|Jairaam S|testing|11:15:00|11:45:00|30|1800
2026-08-08|Sat|FS0350|Janaki L|testing|09:45:00|10:03:00|18|1080
2026-08-08|Sat|FS0237|JONES  KAPIL L|testing|10:43:00|11:13:00|30|1800
2026-08-08|Sat|FST0013|Kalashree A|finance|11:25:00|11:36:00|11|660
2026-08-08|Sat|FS0150|Karthikesan RajaRaman|dev|09:30:00|10:09:00|38|2340
2026-08-08|Sat|FS0397|Kishore Chandran|erp|08:38:00|08:38:00|0|0
2026-08-08|Sat|FS0323|Kishore M|devops|10:21:00|00:05:00|824|49440
2026-08-08|Sat|FS0158|Kishore Theiveekan|dev|09:25:00|09:40:00|15|900
2026-08-08|Sat|FS0437|Lenci Manuela L|it support|10:53:00|11:02:00|9|540
2026-08-08|Sat|FST0022|Madhumitha Chandrasekaran|finance|09:25:00|09:55:00|30|1800
2026-08-08|Sat|FS0135|MAHESH T|cyber|01:02:00|01:32:00|30|1800
2026-08-08|Sat|FS0390|Naveen Prasad Moorthy|dev|08:56:00|09:02:00|5|360
2026-08-08|Sat|FS0287|Nedunchezhiyan  M|dev|08:28:00|08:43:00|15|900
2026-08-08|Sat|FS0321|Nithyanantham V|devops|08:59:00|09:14:00|15|900
2026-08-08|Sat|FS0306|PRAKASH K|dev|00:06:00|00:21:00|15|900
2026-08-08|Sat|FS0322|Praveenkumar Saminathan|devops|11:01:00|11:16:00|15|900
2026-08-08|Sat|FS0209|Pravinabdulkalam Mathikannan|dev|10:18:00|10:22:00|4|240
2026-08-08|Sat|FST0011|Preethi Bernadath|finance|10:30:00|11:00:00|30|1800
2026-08-08|Sat|FS0405|Ragavendraprasath G|erp|09:32:00|09:32:00|0|0
2026-08-08|Sat|FS0144|Ragul Priyan Murugan|dev|10:49:00|11:04:00|15|900
2026-08-08|Sat|FS0424|Rajesh Pannirselvame|cyber|08:12:00|08:42:00|30|1800
2026-08-08|Sat|FS0142|Rajesh Rajendran|dev|09:45:00|10:12:00|27|1620
2026-08-08|Sat|FS0347|Ramachandran M D|erp|09:57:00|09:57:00|0|0
2026-08-08|Sat|FS0398|Ranganathan C|erp|09:40:00|09:46:00|5|360
2026-08-08|Sat|FS0400|Rexlin Felix S|erp|09:39:00|09:39:00|0|0
2026-08-08|Sat|FS0409|Sanjay Boopathy M|finance|10:36:00|02:45:00|969|58140
2026-08-08|Sat|FS0442|Santhoshkumar Palanichamy|dev|09:45:00|10:00:00|15|900
2026-08-08|Sat|FS0334|Sarathi S S|testing|09:30:00|10:15:00|45|2700
2026-08-08|Sat|FS0031|Saravana Pandian S|design|11:27:00|11:27:00|0|0
2026-08-08|Sat|FS0106|Saravanan Devendhiran|dev|09:38:00|09:53:00|15|900
2026-08-08|Sat|FS0148|Selvaprakash Balan|dev|09:35:00|09:40:00|5|300
2026-08-08|Sat|FS0215|Shanmugam Mohanasundaram|dev|09:35:00|14:30:00|295|17700
2026-08-08|Sat|FS0022|Shashti Priyan shathiyavelu|design|10:52:00|10:52:00|0|0
2026-08-08|Sat|FS0391|Shashwath Pasupathi|erp|09:48:00|09:48:00|0|0
2026-08-08|Sat|FS0038|Sooriya Balaji Iyappan|dev|10:01:00|10:16:00|15|900
2026-08-08|Sat|FS0324|Sowmya Prabhu|testing|09:40:00|00:44:00|904|54240
2026-08-08|Sat|FS0423|Sri Cibi Sivakumar|cyber|09:27:00|09:57:00|30|1800
2026-08-08|Sat|FS0329|Sridhar Kumar S|erp|09:17:00|09:17:00|0|0
2026-08-08|Sat|FS0428|Sriganth Chennan|cyber|09:54:00|10:24:00|30|1800
2026-08-08|Sat|FS0318|Suresh Babu S|testing|10:30:00|10:35:00|4|300
2026-08-08|Sat|FS0430|Syed Riyas Niyas|cyber|09:30:00|09:34:00|4|240
2026-08-08|Sat|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:30:00|11:00:00|30|1800
2026-08-08|Sat|FS0291|Vicky  Kumar|erp|09:26:00|09:32:00|5|360
2026-08-08|Sat|FS0302|Vignesh  Babu|cyber|07:47:00|08:17:00|30|1800
2026-08-08|Sat|FS0325|Vijay Prakash A|testing|10:23:00|01:39:00|916|54960
2026-08-08|Sat|FS0353|Vishal Jayaraman|cyber|10:00:00|10:30:00|30|1800
2026-08-08|Sat|FS0089|Yogeshwaran Chandrakasan|dev|09:45:00|10:25:00|39|2400
2026-08-08|Sat|FS0408|Yogeshwaran Govindaraj|erp|09:29:00|09:29:00|0|0
2026-08-09|Sun|FS0213|Sastihari Seenivasan|dev|07:34:00|07:49:00|15|900
2026-08-10|Mon|FS0414|Adam Gil Christ|it support|10:24:00|13:41:00|196|11820
2026-08-10|Mon|FS0152|Ajith Kumar Ramalingam|dev|09:30:00|10:16:00|45|2760
2026-08-10|Mon|FS0190|Anurag Virendrakumar|devops|09:16:00|09:31:00|15|900
2026-08-10|Mon|FS0021|ARJUN V|dev|07:53:00|08:08:00|15|900
2026-08-10|Mon|FS0342|Ashraf A|testing|09:30:00|09:56:00|25|1560
2026-08-10|Mon|FS0018|Asmath Nisha|finance|09:21:00|10:31:00|70|4200
2026-08-10|Mon|FS0426|Astin Ravi|cyber|08:48:00|09:18:00|30|1800
2026-08-10|Mon|FS0050|Avinash Pandian|cyber|08:45:00|09:15:00|30|1800
2026-08-10|Mon|FS0049|Balaji|dev|10:11:00|10:26:00|15|900
2026-08-10|Mon|FS0194|Bharathi Arjunan|dev|09:42:00|09:52:00|9|600
2026-08-10|Mon|FS0377|Daniel Raj N|it support|10:08:00|10:08:00|0|0
2026-08-10|Mon|FS0195|David Mariyajebamalai|dev|11:09:00|11:22:00|12|780
2026-08-10|Mon|FS0277|Deepesh Raj B|dev|10:03:00|10:18:00|15|900
2026-08-10|Mon|FS0281|Dhanalakshmi S|dev|09:18:00|09:22:00|4|240
2026-08-10|Mon|FC0002|Dileep Thammana|finance|09:45:00|10:20:00|34|2100
2026-08-10|Mon|FS0046|Divya Priya Senthilkumaran|pm|10:31:00|10:31:00|0|0
2026-08-10|Mon|FS0320|Gayathri K|data|09:05:00|09:20:00|15|900
2026-08-10|Mon|FS0228|Geetha Karnan|risk|09:30:00|09:44:00|14|840
2026-08-10|Mon|FS0319|Gokulakannan Duraisamy|ml|09:45:00|10:05:00|20|1200
2026-08-10|Mon|FS0073|Gokulakannan Selvam|design|07:58:00|08:05:00|6|420
2026-08-10|Mon|FS0161|Haridha Muruganantham|erp|09:37:00|09:37:00|0|0
2026-08-10|Mon|FS0343|Hariharan Vijayakumar|erp|09:22:00|09:26:00|4|240
2026-08-10|Mon|FS0399|Harthesh Murugan|finance|08:59:00|09:29:00|30|1800
2026-08-10|Mon|FS0338|Jairaam S|testing|11:07:00|11:37:00|30|1800
2026-08-10|Mon|FS0237|JONES  KAPIL L|testing|10:43:00|11:13:00|30|1800
2026-08-10|Mon|FST0013|Kalashree A|finance|09:45:00|10:01:00|16|960
2026-08-10|Mon|FS0289|Kantha  Kumar K|dev|09:06:00|09:12:00|6|360
2026-08-10|Mon|FS0150|Karthikesan RajaRaman|dev|09:30:00|09:36:00|6|360
2026-08-10|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|09:32:00|12:54:00|201|12120
2026-08-10|Mon|FS0158|Kishore Theiveekan|dev|09:12:00|09:26:00|14|840
2026-08-10|Mon|FS0126|Lakshmi Prasanna U|admin|10:44:00|10:44:00|0|0
2026-08-10|Mon|FS0437|Lenci Manuela L|it support|10:52:00|11:01:00|9|540
2026-08-10|Mon|FST0022|Madhumitha Chandrasekaran|finance|09:44:00|10:14:00|30|1800
2026-08-10|Mon|FS0339|Magesh Kumar|cyber|09:49:00|10:33:00|43|2640
2026-08-10|Mon|FS0326|Mahasri Seenivasan|data|09:37:00|10:32:00|55|3300
2026-08-10|Mon|FS0135|MAHESH T|cyber|09:30:00|10:06:00|35|2160
2026-08-10|Mon|FS0076|Meena Rajendran|testing|09:30:00|09:40:00|10|600
2026-08-10|Mon|FS0390|Naveen Prasad Moorthy|dev|09:14:00|09:19:00|4|300
2026-08-10|Mon|FS0287|Nedunchezhiyan  M|dev|07:48:00|08:03:00|15|900
2026-08-10|Mon|FS0321|Nithyanantham V|devops|09:11:00|09:26:00|15|900
2026-08-10|Mon|FS0306|PRAKASH K|dev|08:40:00|08:55:00|15|900
2026-08-10|Mon|FS0322|Praveenkumar Saminathan|devops|10:59:00|11:14:00|15|900
2026-08-10|Mon|FS0209|Pravinabdulkalam Mathikannan|dev|09:30:00|08:40:00|1389|83400
2026-08-10|Mon|FST0011|Preethi Bernadath|finance|11:21:00|11:51:00|30|1800
2026-08-10|Mon|FS0210|Raghul Arumugam|design|03:34:00|17:00:00|806|48360
2026-08-10|Mon|FS0144|Ragul Priyan Murugan|dev|09:30:00|10:01:00|31|1860
2026-08-10|Mon|FS0393|Raja Balaji A|erp|09:23:00|09:23:00|0|0
2026-08-10|Mon|FS0424|Rajesh Pannirselvame|cyber|09:27:00|09:57:00|30|1800
2026-08-10|Mon|FS0398|Ranganathan C|erp|09:29:00|09:37:00|7|480
2026-08-10|Mon|FS0400|Rexlin Felix S|erp|10:08:00|10:08:00|0|0
2026-08-10|Mon|FS0079|Sakthivel Mageshwaran|cyber|10:02:00|10:32:00|30|1800
2026-08-10|Mon|FS0409|Sanjay Boopathy M|finance|10:24:00|10:29:00|4|300
2026-08-10|Mon|FS0212|Santhosh Neelakandamoorthy|dev|09:43:00|09:47:00|4|240
2026-08-10|Mon|FS0442|Santhoshkumar Palanichamy|dev|09:32:00|09:47:00|15|900
2026-08-10|Mon|FS0334|Sarathi S S|testing|09:45:00|10:10:00|25|1500
2026-08-10|Mon|FS0213|Sastihari Seenivasan|dev|08:33:00|08:20:00|1426|85620
2026-08-10|Mon|FS0148|Selvaprakash Balan|dev|09:44:00|09:50:00|5|360
2026-08-10|Mon|FS0125|Shahul Hameed Abdul Samad|risk|09:30:00|10:10:00|40|2400
2026-08-10|Mon|FS0215|Shanmugam Mohanasundaram|dev|09:44:00|09:50:00|5|360
2026-08-10|Mon|FS0022|Shashti Priyan shathiyavelu|design|09:27:00|09:27:00|0|0
2026-08-10|Mon|FS0391|Shashwath Pasupathi|erp|09:50:00|09:50:00|0|0
2026-08-10|Mon|FS0037|Sivashankaran P|dev|09:28:00|09:43:00|15|900
2026-08-10|Mon|FS0038|Sooriya Balaji Iyappan|dev|07:33:00|07:48:00|15|900
2026-08-10|Mon|FS0324|Sowmya Prabhu|testing|09:49:00|09:55:00|5|360
2026-08-10|Mon|FS0329|Sridhar Kumar S|erp|09:22:00|09:22:00|0|0
2026-08-10|Mon|FS0428|Sriganth Chennan|cyber|09:59:00|10:29:00|30|1800
2026-08-10|Mon|FS0082|Stalin Innacimuthu|dev|09:30:00|09:31:00|0|60
2026-08-10|Mon|FS0085|Suryapriya Saravanan|dev|09:45:00|09:48:00|3|180
2026-08-10|Mon|FS0430|Syed Riyas Niyas|cyber|10:02:00|10:32:00|30|1800
2026-08-10|Mon|FS0333|Theeban Babu S|dev|09:04:00|09:19:00|15|900
2026-08-10|Mon|FS0040|Veeravel Devaraj|ml|09:45:00|10:17:00|32|1920
2026-08-10|Mon|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:04:00|10:34:00|30|1800
2026-08-10|Mon|FS0291|Vicky  Kumar|erp|09:44:00|09:44:00|0|0
2026-08-10|Mon|FS0302|Vignesh  Babu|cyber|09:04:00|09:34:00|30|1800
2026-08-10|Mon|FS0325|Vijay Prakash A|testing|10:22:00|03:25:00|1022|61380
2026-08-10|Mon|FS0353|Vishal Jayaraman|cyber|10:51:00|11:21:00|30|1800
2026-08-10|Mon|FS0035|Vivek I|cyber|09:45:00|09:56:00|11|660
2026-08-10|Mon|FS0408|Yogeshwaran Govindaraj|erp|09:54:00|09:54:00|0|0
2026-08-10|Mon|FS0090|Yogeswaran Murugavel|cyber|10:11:00|10:41:00|30|1800
2026-08-10|Mon|FS0407|Yuvaraj Santhanam|erp|09:50:00|10:18:00|27|1680
2026-08-11|Tue|FS0439|Abinesh Nagarajan|devops|10:09:00|10:24:00|15|900
2026-08-11|Tue|FS0414|Adam Gil Christ|it support|10:30:00|10:35:00|5|300
2026-08-11|Tue|FS0190|Anurag Virendrakumar|devops|09:28:00|09:43:00|15|900
2026-08-11|Tue|FS0021|ARJUN V|dev|07:32:00|07:47:00|15|900
2026-08-11|Tue|FS0342|Ashraf A|testing|09:30:00|09:47:00|17|1020
2026-08-11|Tue|FS0018|Asmath Nisha|finance|09:04:00|09:10:00|5|360
2026-08-11|Tue|FS0426|Astin Ravi|cyber|10:08:00|10:38:00|30|1800
2026-08-11|Tue|FS0050|Avinash Pandian|cyber|10:40:00|11:10:00|30|1800
2026-08-11|Tue|FS0049|Balaji|dev|10:40:00|10:55:00|15|900
2026-08-11|Tue|FS0194|Bharathi Arjunan|dev|09:44:00|09:54:00|9|600
2026-08-11|Tue|FS0377|Daniel Raj N|it support|10:02:00|10:02:00|0|0
2026-08-11|Tue|FS0195|David Mariyajebamalai|dev|11:01:00|11:06:00|5|300
2026-08-11|Tue|FS0277|Deepesh Raj B|dev|09:45:00|10:09:00|24|1440
2026-08-11|Tue|FS0243|DELLIBABU T|finance|09:30:00|10:00:00|30|1800
2026-08-11|Tue|FS0281|Dhanalakshmi S|dev|09:20:00|09:25:00|4|300
2026-08-11|Tue|FC0002|Dileep Thammana|finance|09:45:00|10:29:00|44|2640
2026-08-11|Tue|FS0046|Divya Priya Senthilkumaran|pm|10:17:00|10:17:00|0|0
2026-08-11|Tue|FS0311|Ganesh D|design|09:45:00|10:02:00|17|1020
2026-08-11|Tue|FS0320|Gayathri K|data|09:30:00|09:45:00|15|900
2026-08-11|Tue|FS0073|Gokulakannan Selvam|design|08:05:00|08:12:00|6|420
2026-08-11|Tue|FS0161|Haridha Muruganantham|erp|09:36:00|09:36:00|0|0
2026-08-11|Tue|FS0343|Hariharan Vijayakumar|erp|09:36:00|00:06:00|870|52200
2026-08-11|Tue|FS0399|Harthesh Murugan|finance|09:06:00|09:36:00|30|1800
2026-08-11|Tue|FS0036|Jai Surya S|design|08:58:00|09:04:00|6|360
2026-08-11|Tue|FS0338|Jairaam S|testing|09:45:00|10:14:00|29|1740
2026-08-11|Tue|FS0237|JONES  KAPIL L|testing|10:43:00|11:13:00|30|1800
2026-08-11|Tue|FST0013|Kalashree A|finance|09:45:00|10:20:00|35|2100
2026-08-11|Tue|FS0289|Kantha  Kumar K|dev|08:47:00|08:51:00|4|240
2026-08-11|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:50:00|10:04:00|13|840
2026-08-11|Tue|FS0323|Kishore M|devops|11:04:00|11:09:00|4|300
2026-08-11|Tue|FS0158|Kishore Theiveekan|dev|09:05:00|09:19:00|14|840
2026-08-11|Tue|FS0126|Lakshmi Prasanna U|admin|10:53:00|10:53:00|0|0
2026-08-11|Tue|FS0437|Lenci Manuela L|it support|10:30:00|10:38:00|8|480
2026-08-11|Tue|FST0022|Madhumitha Chandrasekaran|finance|09:01:00|09:31:00|30|1800
2026-08-11|Tue|FS0339|Magesh Kumar|cyber|09:47:00|10:39:00|51|3120
2026-08-11|Tue|FS0326|Mahasri Seenivasan|data|09:39:00|09:54:00|15|900
2026-08-11|Tue|FS0135|MAHESH T|cyber|01:16:00|01:46:00|30|1800
2026-08-11|Tue|FS0297|Maruthan G|dev|09:45:00|10:00:00|14|900
2026-08-11|Tue|FS0076|Meena Rajendran|testing|09:45:00|10:23:00|38|2280
2026-08-11|Tue|FS0390|Naveen Prasad Moorthy|dev|09:03:00|09:08:00|5|300
2026-08-11|Tue|FS0287|Nedunchezhiyan  M|dev|09:17:00|09:32:00|15|900
2026-08-11|Tue|FS0321|Nithyanantham V|devops|09:00:00|09:15:00|15|900
2026-08-11|Tue|FS0306|PRAKASH K|dev|08:45:00|09:00:00|15|900
2026-08-11|Tue|FS0322|Praveenkumar Saminathan|devops|11:08:00|11:23:00|15|900
2026-08-11|Tue|FS0209|Pravinabdulkalam Mathikannan|dev|10:10:00|10:30:00|20|1200
2026-08-11|Tue|FST0011|Preethi Bernadath|finance|11:09:00|11:39:00|30|1800
2026-08-11|Tue|FS0210|Raghul Arumugam|design|09:45:00|10:14:00|29|1740
2026-08-11|Tue|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:13:00|27|1680
2026-08-11|Tue|FS0393|Raja Balaji A|erp|09:32:00|09:32:00|0|0
2026-08-11|Tue|FS0424|Rajesh Pannirselvame|cyber|09:17:00|09:47:00|30|1800
2026-08-11|Tue|FS0398|Ranganathan C|erp|09:30:00|00:01:00|871|52260
2026-08-11|Tue|FS0400|Rexlin Felix S|erp|09:56:00|09:56:00|0|0
2026-08-11|Tue|FS0079|Sakthivel Mageshwaran|cyber|10:59:00|11:29:00|30|1800
2026-08-11|Tue|FS0438|Sangeetha Balasubramanian|testing|09:30:00|09:34:00|4|240
2026-08-11|Tue|FS0409|Sanjay Boopathy M|finance|10:30:00|02:20:00|950|57000
2026-08-11|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:45:00|09:46:00|0|60
2026-08-11|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:25:00|09:40:00|15|900
2026-08-11|Tue|FS0031|Saravana Pandian S|design|10:59:00|10:59:00|0|0
2026-08-11|Tue|FS0106|Saravanan Devendhiran|dev|10:57:00|11:12:00|15|900
2026-08-11|Tue|FS0231|Saritha Sekar|risk|10:16:00|10:16:00|0|0
2026-08-11|Tue|FS0213|Sastihari Seenivasan|dev|08:44:00|08:44:00|0|0
2026-08-11|Tue|FS0148|Selvaprakash Balan|dev|09:45:00|10:23:00|37|2280
2026-08-11|Tue|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|10:08:00|22|1380
2026-08-11|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:08:00|07:46:00|1358|81480
2026-08-11|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:28:00|09:28:00|0|0
2026-08-11|Tue|FS0391|Shashwath Pasupathi|erp|09:49:00|09:49:00|0|0
2026-08-11|Tue|FS0037|Sivashankaran P|dev|09:23:00|09:38:00|15|900
2026-08-11|Tue|FS0038|Sooriya Balaji Iyappan|dev|09:16:00|09:31:00|15|900
2026-08-11|Tue|FS0324|Sowmya Prabhu|testing|09:55:00|00:06:00|850|51060
2026-08-11|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:29:00|09:59:00|30|1800
2026-08-11|Tue|FS0329|Sridhar Kumar S|erp|09:13:00|09:13:00|0|0
2026-08-11|Tue|FS0428|Sriganth Chennan|cyber|10:22:00|10:52:00|30|1800
2026-08-11|Tue|FS0318|Suresh Babu S|testing|09:33:00|04:39:00|1145|68760
2026-08-11|Tue|FS0085|Suryapriya Saravanan|dev|09:30:00|10:15:00|44|2700
2026-08-11|Tue|FS0430|Syed Riyas Niyas|cyber|10:05:00|10:35:00|30|1800
2026-08-11|Tue|FS0333|Theeban Babu S|dev|09:04:00|09:19:00|15|900
2026-08-11|Tue|FS0040|Veeravel Devaraj|ml|07:59:00|08:14:00|15|900
2026-08-11|Tue|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:13:00|10:43:00|30|1800
2026-08-11|Tue|FS0291|Vicky  Kumar|erp|09:32:00|09:32:00|0|0
2026-08-11|Tue|FS0302|Vignesh  Babu|cyber|08:52:00|09:22:00|30|1800
2026-08-11|Tue|FS0325|Vijay Prakash A|testing|10:13:00|01:57:00|943|56640
2026-08-11|Tue|FS0353|Vishal Jayaraman|cyber|10:16:00|10:46:00|30|1800
2026-08-11|Tue|FS0219|Visvesvaran Kumaran|dev|09:45:00|10:15:00|30|1800
2026-08-11|Tue|FS0035|Vivek I|cyber|09:45:00|09:47:00|2|120
2026-08-11|Tue|FS0089|Yogeshwaran Chandrakasan|dev|09:45:00|10:09:00|23|1440
2026-08-11|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:36:00|09:36:00|0|0
2026-08-11|Tue|FS0090|Yogeswaran Murugavel|cyber|10:32:00|11:02:00|30|1800
2026-08-11|Tue|FS0407|Yuvaraj Santhanam|erp|09:36:00|09:41:00|5|300
2026-08-12|Wed|FS0439|Abinesh Nagarajan|devops|10:03:00|10:18:00|15|900
2026-08-12|Wed|FS0152|Ajith Kumar Ramalingam|dev|11:24:00|11:39:00|15|900
2026-08-12|Wed|FS0190|Anurag Virendrakumar|devops|09:33:00|09:48:00|15|900
2026-08-12|Wed|FS0021|ARJUN V|dev|07:25:00|07:40:00|15|900
2026-08-12|Wed|FS0342|Ashraf A|testing|01:28:00|00:04:00|1356|81360
2026-08-12|Wed|FS0018|Asmath Nisha|finance|09:45:00|09:54:00|9|540
2026-08-12|Wed|FS0426|Astin Ravi|cyber|09:51:00|10:21:00|30|1800
2026-08-12|Wed|FS0050|Avinash Pandian|cyber|08:40:00|09:10:00|30|1800
2026-08-12|Wed|FS0049|Balaji|dev|09:34:00|09:49:00|15|900
2026-08-12|Wed|FS0194|Bharathi Arjunan|dev|09:55:00|10:04:00|8|540
2026-08-12|Wed|FS0377|Daniel Raj N|it support|09:44:00|09:44:00|0|0
2026-08-12|Wed|FS0195|David Mariyajebamalai|dev|10:23:00|10:39:00|15|960
2026-08-12|Wed|FS0277|Deepesh Raj B|dev|11:15:00|11:30:00|15|900
2026-08-12|Wed|FS0243|DELLIBABU T|finance|09:35:00|10:05:00|30|1800
2026-08-12|Wed|FS0281|Dhanalakshmi S|dev|09:17:00|09:22:00|5|300
2026-08-12|Wed|FS0101|Dhiwan Mariappan|finance|07:52:00|08:22:00|30|1800
2026-08-12|Wed|FC0002|Dileep Thammana|finance|09:30:00|10:11:00|40|2460
2026-08-12|Wed|FS0320|Gayathri K|data|09:21:00|09:36:00|15|900
2026-08-12|Wed|FS0319|Gokulakannan Duraisamy|ml|09:30:00|10:10:00|40|2400
2026-08-12|Wed|FS0073|Gokulakannan Selvam|design|07:54:00|08:02:00|7|480
2026-08-12|Wed|FS0161|Haridha Muruganantham|erp|09:45:00|10:22:00|36|2220
2026-08-12|Wed|FS0343|Hariharan Vijayakumar|erp|09:34:00|00:45:00|911|54660
2026-08-12|Wed|FS0399|Harthesh Murugan|finance|09:08:00|09:38:00|30|1800
2026-08-12|Wed|FS0036|Jai Surya S|design|01:28:00|00:00:00|1352|81120
2026-08-12|Wed|FS0338|Jairaam S|testing|09:30:00|09:35:00|4|300
2026-08-12|Wed|FS0237|JONES  KAPIL L|testing|10:43:00|11:13:00|30|1800
2026-08-12|Wed|FST0013|Kalashree A|finance|09:30:00|09:49:00|18|1140
2026-08-12|Wed|FS0289|Kantha  Kumar K|dev|08:51:00|08:59:00|7|480
2026-08-12|Wed|FS0323|Kishore M|devops|11:26:00|08:29:00|1262|75780
2026-08-12|Wed|FS0158|Kishore Theiveekan|dev|09:18:00|09:26:00|8|480
2026-08-12|Wed|FS0437|Lenci Manuela L|it support|10:57:00|11:05:00|8|480
2026-08-12|Wed|FST0022|Madhumitha Chandrasekaran|finance|10:00:00|10:30:00|30|1800
2026-08-12|Wed|FS0339|Magesh Kumar|cyber|09:55:00|10:23:00|28|1680
2026-08-12|Wed|FS0326|Mahasri Seenivasan|data|09:33:00|09:48:00|15|900
2026-08-12|Wed|FS0135|MAHESH T|cyber|02:41:00|03:11:00|30|1800
2026-08-12|Wed|FS0027|Manikadan P|design|10:47:00|11:14:00|27|1620
2026-08-12|Wed|FS0133|maruthupandiyan mathuraiveeran|dev|11:24:00|11:39:00|15|900
2026-08-12|Wed|FS0076|Meena Rajendran|testing|09:30:00|09:56:00|25|1560
2026-08-12|Wed|FS0390|Naveen Prasad Moorthy|dev|09:01:00|09:06:00|5|300
2026-08-12|Wed|FS0287|Nedunchezhiyan  M|dev|09:14:00|09:29:00|15|900
2026-08-12|Wed|FS0321|Nithyanantham V|devops|08:45:00|09:00:00|15|900
2026-08-12|Wed|FS0306|PRAKASH K|dev|01:28:00|01:43:00|15|900
2026-08-12|Wed|FS0322|Praveenkumar Saminathan|devops|10:59:00|11:14:00|15|900
2026-08-12|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|10:21:00|10:50:00|28|1740
2026-08-12|Wed|FST0011|Preethi Bernadath|finance|11:08:00|11:38:00|30|1800
2026-08-12|Wed|FS0210|Raghul Arumugam|design|04:08:00|04:08:00|0|0
2026-08-12|Wed|FS0393|Raja Balaji A|erp|09:28:00|09:28:00|0|0
2026-08-12|Wed|FS0424|Rajesh Pannirselvame|cyber|09:37:00|10:07:00|30|1800
2026-08-12|Wed|FS0142|Rajesh Rajendran|dev|09:30:00|09:52:00|21|1320
2026-08-12|Wed|FS0398|Ranganathan C|erp|09:36:00|09:41:00|4|300
2026-08-12|Wed|FS0400|Rexlin Felix S|erp|09:48:00|09:48:00|0|0
2026-08-12|Wed|FS0079|Sakthivel Mageshwaran|cyber|09:30:00|10:03:00|33|1980
2026-08-12|Wed|FS0438|Sangeetha Balasubramanian|testing|09:30:00|09:34:00|4|240
2026-08-12|Wed|FS0409|Sanjay Boopathy M|finance|10:25:00|01:14:00|889|53340
2026-08-12|Wed|FS0442|Santhoshkumar Palanichamy|dev|09:35:00|09:50:00|15|900
2026-08-12|Wed|FS0031|Saravana Pandian S|design|01:27:00|01:27:00|0|0
2026-08-12|Wed|FS0106|Saravanan Devendhiran|dev|10:51:00|11:06:00|15|900
2026-08-12|Wed|FS0231|Saritha Sekar|risk|09:45:00|10:11:00|26|1560
2026-08-12|Wed|FS0213|Sastihari Seenivasan|dev|08:36:00|08:43:00|7|420
2026-08-12|Wed|FS0148|Selvaprakash Balan|dev|09:09:00|09:06:00|1436|86220
2026-08-12|Wed|FS0022|Shashti Priyan shathiyavelu|design|09:38:00|09:38:00|0|0
2026-08-12|Wed|FS0391|Shashwath Pasupathi|erp|09:50:00|09:50:00|0|0
2026-08-12|Wed|FS0038|Sooriya Balaji Iyappan|dev|09:11:00|09:26:00|15|900
2026-08-12|Wed|FS0324|Sowmya Prabhu|testing|09:52:00|01:04:00|911|54720
2026-08-12|Wed|FS0329|Sridhar Kumar S|erp|09:12:00|09:12:00|0|0
2026-08-12|Wed|FS0428|Sriganth Chennan|cyber|09:57:00|10:27:00|30|1800
2026-08-12|Wed|FS0318|Suresh Babu S|testing|09:40:00|02:10:00|990|59400
2026-08-12|Wed|FS0333|Theeban Babu S|dev|09:00:00|09:15:00|15|900
2026-08-12|Wed|FS0040|Veeravel Devaraj|ml|00:56:00|01:11:00|15|900
2026-08-12|Wed|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:08:00|10:38:00|30|1800
2026-08-12|Wed|FS0291|Vicky  Kumar|erp|09:33:00|09:33:00|0|0
2026-08-12|Wed|FS0302|Vignesh  Babu|cyber|08:49:00|09:19:00|30|1800
2026-08-12|Wed|FS0325|Vijay Prakash A|testing|10:11:00|00:14:00|842|50580
2026-08-12|Wed|FS0353|Vishal Jayaraman|cyber|10:23:00|10:53:00|30|1800
2026-08-12|Wed|FS0219|Visvesvaran Kumaran|dev|01:46:00|00:44:00|1377|82680
2026-08-12|Wed|FS0035|Vivek I|cyber|09:45:00|10:05:00|20|1200
2026-08-12|Wed|FS0294|Yamuna  M|dev|09:45:00|10:31:00|45|2760
2026-08-12|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:34:00|09:34:00|0|0
2026-08-12|Wed|FS0090|Yogeswaran Murugavel|cyber|10:57:00|11:27:00|30|1800
2026-08-12|Wed|FS0407|Yuvaraj Santhanam|erp|09:42:00|10:15:00|32|1980
2026-08-13|Thu|FS0439|Abinesh Nagarajan|devops|09:58:00|10:13:00|15|900
2026-08-13|Thu|FS0414|Adam Gil Christ|it support|09:58:00|10:49:00|50|3060
2026-08-13|Thu|FS0190|Anurag Virendrakumar|devops|09:24:00|09:39:00|15|900
2026-08-13|Thu|FS0021|ARJUN V|dev|08:48:00|09:03:00|15|900
2026-08-13|Thu|FS0342|Ashraf A|testing|09:30:00|09:40:00|9|600
2026-08-13|Thu|FS0018|Asmath Nisha|finance|09:30:00|10:13:00|43|2580
2026-08-13|Thu|FS0426|Astin Ravi|cyber|09:38:00|10:08:00|30|1800
2026-08-13|Thu|FS0050|Avinash Pandian|cyber|08:57:00|09:27:00|30|1800
2026-08-13|Thu|FS0049|Balaji|dev|09:19:00|09:34:00|15|900
2026-08-13|Thu|FS0194|Bharathi Arjunan|dev|10:06:00|10:16:00|9|600
2026-08-13|Thu|FS0377|Daniel Raj N|it support|09:33:00|09:33:00|0|0
2026-08-13|Thu|FS0195|David Mariyajebamalai|dev|10:44:00|00:03:00|799|47940
2026-08-13|Thu|FS0277|Deepesh Raj B|dev|10:37:00|10:52:00|15|900
2026-08-13|Thu|FS0243|DELLIBABU T|finance|09:21:00|09:51:00|30|1800
2026-08-13|Thu|FS0281|Dhanalakshmi S|dev|09:21:00|09:26:00|4|300
2026-08-13|Thu|FS0101|Dhiwan Mariappan|finance|07:45:00|08:15:00|30|1800
2026-08-13|Thu|FC0002|Dileep Thammana|finance|09:30:00|09:46:00|15|960
2026-08-13|Thu|FS0046|Divya Priya Senthilkumaran|pm|10:19:00|10:19:00|0|0
2026-08-13|Thu|FS0311|Ganesh D|design|09:30:00|09:47:00|16|1020
2026-08-13|Thu|FS0319|Gokulakannan Duraisamy|ml|09:45:00|10:12:00|27|1620
2026-08-13|Thu|FS0073|Gokulakannan Selvam|design|07:54:00|08:02:00|7|480
2026-08-13|Thu|FS0161|Haridha Muruganantham|erp|09:38:00|09:38:00|0|0
2026-08-13|Thu|FS0343|Hariharan Vijayakumar|erp|09:41:00|09:49:00|8|480
2026-08-13|Thu|FS0399|Harthesh Murugan|finance|09:27:00|09:57:00|30|1800
2026-08-13|Thu|FS0036|Jai Surya S|design|09:48:00|10:40:00|52|3120
2026-08-13|Thu|FS0350|Janaki L|testing|09:30:00|09:45:00|14|900
2026-08-13|Thu|FS0237|JONES  KAPIL L|testing|10:40:00|11:10:00|30|1800
2026-08-13|Thu|FST0013|Kalashree A|finance|11:28:00|11:46:00|17|1080
2026-08-13|Thu|FS0289|Kantha  Kumar K|dev|08:55:00|08:59:00|4|240
2026-08-13|Thu|FS0433|keerthivaasen.v@finstein.ai|cyber|09:26:00|08:30:00|1383|83040
2026-08-13|Thu|FS0397|Kishore Chandran|erp|09:35:00|09:35:00|0|0
2026-08-13|Thu|FS0323|Kishore M|devops|10:44:00|09:30:00|1366|81960
2026-08-13|Thu|FS0039|Kumaresan Krishnan|finance|09:30:00|09:43:00|13|780
2026-08-13|Thu|FS0126|Lakshmi Prasanna U|admin|10:53:00|10:53:00|0|0
2026-08-13|Thu|FS0437|Lenci Manuela L|it support|10:53:00|11:03:00|9|600
2026-08-13|Thu|FS0339|Magesh Kumar|cyber|10:01:00|10:42:00|40|2460
2026-08-13|Thu|FS0326|Mahasri Seenivasan|data|09:30:00|09:32:00|2|120
2026-08-13|Thu|FS0135|MAHESH T|cyber|09:30:00|10:09:00|39|2340
2026-08-13|Thu|FS0297|Maruthan G|dev|09:30:00|09:53:00|23|1380
2026-08-13|Thu|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|09:58:00|28|1680
2026-08-13|Thu|FS0076|Meena Rajendran|testing|09:30:00|10:02:00|31|1920
2026-08-13|Thu|FS0390|Naveen Prasad Moorthy|dev|09:18:00|09:23:00|5|300
2026-08-13|Thu|FS0287|Nedunchezhiyan  M|dev|09:23:00|09:38:00|15|900
2026-08-13|Thu|FS0321|Nithyanantham V|devops|09:14:00|09:29:00|15|900
2026-08-13|Thu|FS0306|PRAKASH K|dev|09:10:00|09:25:00|15|900
2026-08-13|Thu|FS0322|Praveenkumar Saminathan|devops|11:28:00|11:43:00|15|900
2026-08-13|Thu|FS0209|Pravinabdulkalam Mathikannan|dev|10:23:00|10:27:00|4|240
2026-08-13|Thu|FST0011|Preethi Bernadath|finance|09:45:00|10:04:00|19|1140
2026-08-13|Thu|FS0405|Ragavendraprasath G|erp|10:28:00|10:28:00|0|0
2026-08-13|Thu|FS0144|Ragul Priyan Murugan|dev|11:26:00|11:41:00|15|900
2026-08-13|Thu|FS0393|Raja Balaji A|erp|08:32:00|08:32:00|0|0
2026-08-13|Thu|FS0331|Rajesh Kumar A|testing|09:30:00|09:45:00|15|900
2026-08-13|Thu|FS0424|Rajesh Pannirselvame|cyber|09:15:00|09:45:00|30|1800
2026-08-13|Thu|FS0347|Ramachandran M D|erp|10:01:00|10:01:00|0|0
2026-08-13|Thu|FS0398|Ranganathan C|erp|09:33:00|09:38:00|4|300
2026-08-13|Thu|FS0400|Rexlin Felix S|erp|10:39:00|10:39:00|0|0
2026-08-13|Thu|FS0079|Sakthivel Mageshwaran|cyber|10:21:00|10:51:00|30|1800
2026-08-13|Thu|FS0438|Sangeetha Balasubramanian|testing|09:31:00|00:46:00|915|54900
2026-08-13|Thu|FS0409|Sanjay Boopathy M|finance|09:55:00|03:27:00|1052|63120
2026-08-13|Thu|FS0442|Santhoshkumar Palanichamy|dev|09:45:00|09:52:00|7|420
2026-08-13|Thu|FS0106|Saravanan Devendhiran|dev|09:45:00|10:17:00|32|1920
2026-08-13|Thu|FS0213|Sastihari Seenivasan|dev|08:57:00|10:36:00|99|5940
2026-08-13|Thu|FS0148|Selvaprakash Balan|dev|09:30:00|09:39:00|9|540
2026-08-13|Thu|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|09:46:00|0|60
2026-08-13|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:44:00|09:51:00|6|420
2026-08-13|Thu|FS0022|Shashti Priyan shathiyavelu|design|09:28:00|09:28:00|0|0
2026-08-13|Thu|FS0391|Shashwath Pasupathi|erp|09:55:00|09:55:00|0|0
2026-08-13|Thu|FS0037|Sivashankaran P|dev|09:09:00|09:24:00|15|900
2026-08-13|Thu|FS0038|Sooriya Balaji Iyappan|dev|08:52:00|09:07:00|15|900
2026-08-13|Thu|FS0324|Sowmya Prabhu|testing|10:01:00|10:06:00|5|300
2026-08-13|Thu|FS0329|Sridhar Kumar S|erp|09:17:00|09:17:00|0|0
2026-08-13|Thu|FS0428|Sriganth Chennan|cyber|09:58:00|10:28:00|30|1800
2026-08-13|Thu|FS0318|Suresh Babu S|testing|09:35:00|01:22:00|946|56820
2026-08-13|Thu|FS0085|Suryapriya Saravanan|dev|09:45:00|09:52:00|7|420
2026-08-13|Thu|FS0333|Theeban Babu S|dev|09:45:00|10:12:00|27|1620
2026-08-13|Thu|FS0040|Veeravel Devaraj|ml|11:29:00|11:44:00|15|900
2026-08-13|Thu|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:24:00|10:54:00|30|1800
2026-08-13|Thu|FS0291|Vicky  Kumar|erp|09:04:00|09:10:00|6|360
2026-08-13|Thu|FS0302|Vignesh  Babu|cyber|08:58:00|09:28:00|30|1800
2026-08-13|Thu|FS0325|Vijay Prakash A|testing|10:12:00|04:33:00|1100|66060
2026-08-13|Thu|FS0239|VIJAY S R|testing|09:45:00|10:15:00|29|1800
2026-08-13|Thu|FS0353|Vishal Jayaraman|cyber|10:21:00|10:51:00|30|1800
2026-08-13|Thu|FS0035|Vivek I|cyber|09:45:00|10:29:00|43|2640
2026-08-13|Thu|FS0294|Yamuna  M|dev|09:45:00|09:56:00|10|660
2026-08-13|Thu|FS0089|Yogeshwaran Chandrakasan|dev|09:45:00|10:23:00|37|2280
2026-08-13|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:41:00|09:41:00|0|0
2026-08-13|Thu|FS0090|Yogeswaran Murugavel|cyber|10:28:00|10:58:00|30|1800
2026-08-13|Thu|FS0407|Yuvaraj Santhanam|erp|09:47:00|10:37:00|50|3000
2026-08-14|Fri|FS0439|Abinesh Nagarajan|devops|10:11:00|10:26:00|15|900
2026-08-14|Fri|FS0190|Anurag Virendrakumar|devops|09:26:00|09:41:00|15|900
2026-08-14|Fri|FS0342|Ashraf A|testing|08:46:00|00:08:00|922|55320
2026-08-14|Fri|FS0018|Asmath Nisha|finance|09:11:00|09:17:00|5|360
2026-08-14|Fri|FS0426|Astin Ravi|cyber|09:28:00|09:58:00|30|1800
2026-08-14|Fri|FS0049|Balaji|dev|09:45:00|09:46:00|0|60
2026-08-14|Fri|FS0188|Bharadwaj Kalathur Vadyar|finance|10:43:00|11:13:00|30|1800
2026-08-14|Fri|FS0377|Daniel Raj N|it support|09:50:00|09:50:00|0|0
2026-08-14|Fri|FS0277|Deepesh Raj B|dev|09:30:00|09:53:00|23|1380
2026-08-14|Fri|FS0243|DELLIBABU T|finance|09:29:00|09:59:00|30|1800
2026-08-14|Fri|FS0281|Dhanalakshmi S|dev|09:29:00|09:34:00|5|300
2026-08-14|Fri|FS0101|Dhiwan Mariappan|finance|07:53:00|08:23:00|30|1800
2026-08-14|Fri|FC0002|Dileep Thammana|finance|11:08:00|11:38:00|30|1800
2026-08-14|Fri|FS0046|Divya Priya Senthilkumaran|pm|10:18:00|10:18:00|0|0
2026-08-14|Fri|FS0161|Haridha Muruganantham|erp|09:43:00|09:43:00|0|0
2026-08-14|Fri|FS0343|Hariharan Vijayakumar|erp|09:39:00|01:53:00|973|58440
2026-08-14|Fri|FS0399|Harthesh Murugan|finance|09:15:00|09:45:00|30|1800
2026-08-14|Fri|FS0036|Jai Surya S|design|10:09:00|12:00:00|110|6660
2026-08-14|Fri|FS0338|Jairaam S|testing|10:49:00|11:19:00|30|1800
2026-08-14|Fri|FS0350|Janaki L|testing|10:37:00|11:07:00|30|1800
2026-08-14|Fri|FS0237|JONES  KAPIL L|testing|10:41:00|11:11:00|30|1800
2026-08-14|Fri|FST0013|Kalashree A|finance|09:45:00|10:18:00|32|1980
2026-08-14|Fri|FS0289|Kantha  Kumar K|dev|09:02:00|09:06:00|4|240
2026-08-14|Fri|FS0397|Kishore Chandran|erp|08:56:00|08:56:00|0|0
2026-08-14|Fri|FS0323|Kishore M|devops|10:26:00|08:52:00|1346|80760
2026-08-14|Fri|FS0158|Kishore Theiveekan|dev|09:41:00|09:42:00|1|60
2026-08-14|Fri|FS0039|Kumaresan Krishnan|finance|09:45:00|10:03:00|17|1080
2026-08-14|Fri|FS0126|Lakshmi Prasanna U|admin|10:24:00|10:24:00|0|0
2026-08-14|Fri|FST0022|Madhumitha Chandrasekaran|finance|10:12:00|10:42:00|30|1800
2026-08-14|Fri|FS0339|Magesh Kumar|cyber|09:55:00|10:12:00|16|1020
2026-08-14|Fri|FS0135|MAHESH T|cyber|04:02:00|04:32:00|30|1800
2026-08-14|Fri|FS0027|Manikadan P|design|10:48:00|12:30:00|102|6120
2026-08-14|Fri|FS0297|Maruthan G|dev|09:30:00|09:38:00|8|480
2026-08-14|Fri|FS0076|Meena Rajendran|testing|09:30:00|10:08:00|37|2280
2026-08-14|Fri|FS0298|Nantha Guru|dev|09:45:00|10:28:00|42|2580
2026-08-14|Fri|FS0390|Naveen Prasad Moorthy|dev|09:39:00|09:44:00|5|300
2026-08-14|Fri|FS0287|Nedunchezhiyan  M|dev|00:14:00|00:29:00|15|900
2026-08-14|Fri|FS0321|Nithyanantham V|devops|09:43:00|09:58:00|15|900
2026-08-14|Fri|FS0322|Praveenkumar Saminathan|devops|09:30:00|09:45:00|15|900
2026-08-14|Fri|FS0209|Pravinabdulkalam Mathikannan|dev|10:27:00|10:49:00|21|1320
2026-08-14|Fri|FST0011|Preethi Bernadath|finance|11:28:00|11:58:00|30|1800
2026-08-14|Fri|FS0405|Ragavendraprasath G|erp|09:45:00|09:45:00|0|0
2026-08-14|Fri|FS0144|Ragul Priyan Murugan|dev|09:45:00|10:24:00|38|2340
2026-08-14|Fri|FS0393|Raja Balaji A|erp|08:19:00|08:19:00|0|0
2026-08-14|Fri|FS0424|Rajesh Pannirselvame|cyber|09:03:00|09:33:00|30|1800
2026-08-14|Fri|FS0347|Ramachandran M D|erp|09:49:00|09:49:00|0|0
2026-08-14|Fri|FS0398|Ranganathan C|erp|09:35:00|09:41:00|5|360
2026-08-14|Fri|FS0400|Rexlin Felix S|erp|09:45:00|09:45:00|0|0
2026-08-14|Fri|FS0079|Sakthivel Mageshwaran|cyber|10:14:00|10:44:00|30|1800
2026-08-14|Fri|FS0438|Sangeetha Balasubramanian|testing|09:29:00|09:33:00|4|240
2026-08-14|Fri|FS0409|Sanjay Boopathy M|finance|10:25:00|00:25:00|840|50400
2026-08-14|Fri|FS0031|Saravana Pandian S|design|09:45:00|09:56:00|10|660
2026-08-14|Fri|FS0231|Saritha Sekar|risk|11:01:00|11:01:00|0|0
2026-08-14|Fri|FS0130|Sathish Kumar Stalin|finance|09:30:00|09:34:00|4|240
2026-08-14|Fri|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|09:59:00|13|840
2026-08-14|Fri|FS0022|Shashti Priyan shathiyavelu|design|09:36:00|09:36:00|0|0
2026-08-14|Fri|FS0391|Shashwath Pasupathi|erp|10:08:00|10:08:00|0|0
2026-08-14|Fri|FS0037|Sivashankaran P|dev|09:19:00|09:34:00|15|900
2026-08-14|Fri|FS0324|Sowmya Prabhu|testing|09:52:00|10:22:00|30|1800
2026-08-14|Fri|FS0329|Sridhar Kumar S|erp|09:15:00|09:15:00|0|0
2026-08-14|Fri|FS0085|Suryapriya Saravanan|dev|11:24:00|11:39:00|15|900
2026-08-14|Fri|FS0430|Syed Riyas Niyas|cyber|09:45:00|09:58:00|12|780
2026-08-14|Fri|FS0333|Theeban Babu S|dev|10:17:00|10:32:00|15|900
2026-08-14|Fri|FS0040|Veeravel Devaraj|ml|02:21:00|02:36:00|15|900
2026-08-14|Fri|FS0300|Venkata Sai  Dheeraj Kumar|cyber|10:05:00|10:35:00|30|1800
2026-08-14|Fri|FS0291|Vicky  Kumar|erp|09:24:00|09:29:00|5|300
2026-08-14|Fri|FS0302|Vignesh  Babu|cyber|08:57:00|09:27:00|30|1800
2026-08-14|Fri|FS0325|Vijay Prakash A|testing|10:22:00|10:26:00|4|240
2026-08-14|Fri|FS0294|Yamuna  M|dev|10:16:00|10:31:00|15|900
2026-08-14|Fri|FS0089|Yogeshwaran Chandrakasan|dev|00:11:00|00:26:00|15|900
2026-08-14|Fri|FS0408|Yogeshwaran Govindaraj|erp|09:39:00|09:39:00|0|0
2026-08-14|Fri|FS0090|Yogeswaran Murugavel|cyber|11:09:00|11:39:00|30|1800
2026-08-14|Fri|FS0407|Yuvaraj Santhanam|erp|09:58:00|11:40:00|102|6120
2026-08-15|Sat|FS0125|Shahul Hameed Abdul Samad|risk|00:22:00|00:22:00|0|0
2026-08-16|Sun|FS0287|Nedunchezhiyan  M|dev|09:45:00|09:47:00|1|120
2026-08-16|Sun|FS0079|Sakthivel Mageshwaran|cyber|09:30:00|10:13:00|42|2580
2026-08-17|Mon|FS0439|Abinesh Nagarajan|devops|09:30:00|09:55:00|25|1500
2026-08-17|Mon|FS0190|Anurag Virendrakumar|devops|09:24:00|09:39:00|15|900
2026-08-17|Mon|FS0426|Astin Ravi|cyber|09:51:00|10:21:00|30|1800
2026-08-17|Mon|FS0194|Bharathi Arjunan|dev|10:29:00|10:44:00|15|900
2026-08-17|Mon|FS0377|Daniel Raj N|it support|10:02:00|10:02:00|0|0
2026-08-17|Mon|FS0195|David Mariyajebamalai|dev|11:05:00|11:09:00|4|240
2026-08-17|Mon|FS0277|Deepesh Raj B|dev|09:45:00|10:14:00|28|1740
2026-08-17|Mon|FS0243|DELLIBABU T|finance|09:35:00|10:05:00|30|1800
2026-08-17|Mon|FS0046|Divya Priya Senthilkumaran|pm|09:45:00|09:59:00|13|840
2026-08-17|Mon|FS0073|Gokulakannan Selvam|design|07:54:00|08:02:00|7|480
2026-08-17|Mon|FS0161|Haridha Muruganantham|erp|09:38:00|09:38:00|0|0
2026-08-17|Mon|FS0343|Hariharan Vijayakumar|erp|09:33:00|09:37:00|4|240
2026-08-17|Mon|FS0399|Harthesh Murugan|finance|09:28:00|09:58:00|30|1800
2026-08-17|Mon|FS0237|JONES  KAPIL L|testing|10:42:00|11:12:00|30|1800
2026-08-17|Mon|FS0289|Kantha  Kumar K|dev|08:53:00|08:57:00|4|240
2026-08-17|Mon|FS0433|keerthivaasen.v@finstein.ai|cyber|09:45:00|10:28:00|43|2580
2026-08-17|Mon|FS0397|Kishore Chandran|erp|08:48:00|08:48:00|0|0
2026-08-17|Mon|FS0323|Kishore M|devops|11:04:00|11:19:00|14|900
2026-08-17|Mon|FS0437|Lenci Manuela L|it support|10:40:00|10:51:00|10|660
2026-08-17|Mon|FST0022|Madhumitha Chandrasekaran|finance|08:08:00|08:38:00|30|1800
2026-08-17|Mon|FS0339|Magesh Kumar|cyber|10:06:00|10:47:00|41|2460
2026-08-17|Mon|FS0135|MAHESH T|cyber|09:45:00|09:48:00|2|180
2026-08-17|Mon|FS0027|Manikadan P|design|11:03:00|11:19:00|15|960
2026-08-17|Mon|FS0297|Maruthan G|dev|09:45:00|09:49:00|4|240
2026-08-17|Mon|FS0390|Naveen Prasad Moorthy|dev|09:02:00|09:08:00|5|360
2026-08-17|Mon|FS0321|Nithyanantham V|devops|09:24:00|09:39:00|15|900
2026-08-17|Mon|FS0209|Pravinabdulkalam Mathikannan|dev|06:42:00|11:18:00|275|16560
2026-08-17|Mon|FST0011|Preethi Bernadath|finance|11:08:00|11:38:00|30|1800
2026-08-17|Mon|FS0393|Raja Balaji A|erp|09:32:00|09:32:00|0|0
2026-08-17|Mon|FS0331|Rajesh Kumar A|testing|11:16:00|11:46:00|30|1800
2026-08-17|Mon|FS0424|Rajesh Pannirselvame|cyber|10:13:00|10:43:00|30|1800
2026-08-17|Mon|FS0347|Ramachandran M D|erp|09:35:00|09:35:00|0|0
2026-08-17|Mon|FS0400|Rexlin Felix S|erp|09:47:00|09:47:00|0|0
2026-08-17|Mon|FS0438|Sangeetha Balasubramanian|testing|09:40:00|10:10:00|30|1800
2026-08-17|Mon|FS0409|Sanjay Boopathy M|finance|10:20:00|07:41:00|1280|76860
2026-08-17|Mon|FS0031|Saravana Pandian S|design|11:01:00|11:01:00|0|0
2026-08-17|Mon|FS0106|Saravanan Devendhiran|dev|09:53:00|10:08:00|15|900
2026-08-17|Mon|FS0213|Sastihari Seenivasan|dev|07:32:00|09:42:00|129|7800
2026-08-17|Mon|FS0130|Sathish Kumar Stalin|finance|09:45:00|10:13:00|27|1680
2026-08-17|Mon|FS0022|Shashti Priyan shathiyavelu|design|08:56:00|08:56:00|0|0
2026-08-17|Mon|FS0391|Shashwath Pasupathi|erp|09:44:00|09:44:00|0|0
2026-08-17|Mon|FS0037|Sivashankaran P|dev|09:30:00|10:05:00|35|2100
2026-08-17|Mon|FS0038|Sooriya Balaji Iyappan|dev|07:13:00|07:28:00|15|900
2026-08-17|Mon|FS0329|Sridhar Kumar S|erp|09:27:00|09:27:00|0|0
2026-08-17|Mon|FS0040|Veeravel Devaraj|ml|09:45:00|10:08:00|23|1380
2026-08-17|Mon|FS0291|Vicky  Kumar|erp|09:32:00|09:36:00|4|240
2026-08-17|Mon|FS0325|Vijay Prakash A|testing|10:33:00|10:37:00|4|240
2026-08-17|Mon|FS0353|Vishal Jayaraman|cyber|10:26:00|10:56:00|30|1800
2026-08-17|Mon|FS0408|Yogeshwaran Govindaraj|erp|09:35:00|09:35:00|0|0
2026-08-17|Mon|FS0407|Yuvaraj Santhanam|erp|09:39:00|11:45:00|125|7560
2026-08-18|Tue|FS0439|Abinesh Nagarajan|devops|10:00:00|10:15:00|15|900
2026-08-18|Tue|FS0414|Adam Gil Christ|it support|10:04:00|10:34:00|29|1800
2026-08-18|Tue|FS0190|Anurag Virendrakumar|devops|09:38:00|09:53:00|15|900
2026-08-18|Tue|FS0018|Asmath Nisha|finance|09:28:00|10:18:00|50|3000
2026-08-18|Tue|FS0426|Astin Ravi|cyber|10:04:00|10:34:00|30|1800
2026-08-18|Tue|FS0194|Bharathi Arjunan|dev|09:54:00|10:09:00|15|900
2026-08-18|Tue|FS0377|Daniel Raj N|it support|10:07:00|10:07:00|0|0
2026-08-18|Tue|FS0195|David Mariyajebamalai|dev|11:10:00|11:19:00|8|540
2026-08-18|Tue|FS0340|Deepa K|testing|09:30:00|09:34:00|3|240
2026-08-18|Tue|FS0277|Deepesh Raj B|dev|10:26:00|10:41:00|15|900
2026-08-18|Tue|FS0243|DELLIBABU T|finance|09:49:00|10:19:00|30|1800
2026-08-18|Tue|FS0281|Dhanalakshmi S|dev|09:41:00|09:51:00|10|600
2026-08-18|Tue|FS0101|Dhiwan Mariappan|finance|07:45:00|08:15:00|30|1800
2026-08-18|Tue|FS0046|Divya Priya Senthilkumaran|pm|10:14:00|10:14:00|0|0
2026-08-18|Tue|FS0311|Ganesh D|design|09:30:00|09:45:00|14|900
2026-08-18|Tue|FS0319|Gokulakannan Duraisamy|ml|10:53:00|11:08:00|15|900
2026-08-18|Tue|FS0073|Gokulakannan Selvam|design|07:53:00|08:00:00|7|420
2026-08-18|Tue|FS0161|Haridha Muruganantham|erp|09:38:00|09:38:00|0|0
2026-08-18|Tue|FS0343|Hariharan Vijayakumar|erp|09:38:00|01:32:00|954|57240
2026-08-18|Tue|FS0399|Harthesh Murugan|finance|09:16:00|09:46:00|30|1800
2026-08-18|Tue|FS0338|Jairaam S|testing|09:30:00|09:31:00|0|60
2026-08-18|Tue|FS0237|JONES  KAPIL L|testing|10:38:00|11:08:00|30|1800
2026-08-18|Tue|FS0289|Kantha  Kumar K|dev|08:33:00|07:18:00|1365|81900
2026-08-18|Tue|FS0200|Kavinkumar Ramasamy|dev|09:45:00|10:01:00|15|960
2026-08-18|Tue|FS0433|keerthivaasen.v@finstein.ai|cyber|09:30:00|09:50:00|19|1200
2026-08-18|Tue|FS0397|Kishore Chandran|erp|08:42:00|08:42:00|0|0
2026-08-18|Tue|FS0323|Kishore M|devops|10:56:00|11:03:00|7|420
2026-08-18|Tue|FS0158|Kishore Theiveekan|dev|09:34:00|09:25:00|1430|85860
2026-08-18|Tue|FS0039|Kumaresan Krishnan|finance|09:30:00|09:53:00|22|1380
2026-08-18|Tue|FS0437|Lenci Manuela L|it support|11:08:00|11:18:00|9|600
2026-08-18|Tue|FST0022|Madhumitha Chandrasekaran|finance|08:36:00|09:06:00|30|1800
2026-08-18|Tue|FS0339|Magesh Kumar|cyber|09:38:00|09:53:00|14|900
2026-08-18|Tue|FS0326|Mahasri Seenivasan|data|09:36:00|09:51:00|15|900
2026-08-18|Tue|FS0135|MAHESH T|cyber|03:11:00|03:41:00|30|1800
2026-08-18|Tue|FS0027|Manikadan P|design|09:45:00|10:06:00|20|1260
2026-08-18|Tue|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|10:06:00|36|2160
2026-08-18|Tue|FS0390|Naveen Prasad Moorthy|dev|09:09:00|09:14:00|5|300
2026-08-18|Tue|FS0321|Nithyanantham V|devops|00:30:00|00:45:00|15|900
2026-08-18|Tue|FS0306|PRAKASH K|dev|09:30:00|10:05:00|34|2100
2026-08-18|Tue|FS0209|Pravinabdulkalam Mathikannan|dev|10:38:00|10:57:00|19|1140
2026-08-18|Tue|FST0011|Preethi Bernadath|finance|09:30:00|10:06:00|35|2160
2026-08-18|Tue|FS0405|Ragavendraprasath G|erp|09:31:00|09:31:00|0|0
2026-08-18|Tue|FS0144|Ragul Priyan Murugan|dev|09:30:00|09:45:00|15|900
2026-08-18|Tue|FS0393|Raja Balaji A|erp|08:41:00|08:41:00|0|0
2026-08-18|Tue|FS0424|Rajesh Pannirselvame|cyber|09:10:00|09:40:00|30|1800
2026-08-18|Tue|FS0347|Ramachandran M D|erp|09:31:00|09:31:00|0|0
2026-08-18|Tue|FS0398|Ranganathan C|erp|09:11:00|09:16:00|5|300
2026-08-18|Tue|FS0400|Rexlin Felix S|erp|09:53:00|09:53:00|0|0
2026-08-18|Tue|FS0438|Sangeetha Balasubramanian|testing|09:36:00|10:06:00|30|1800
2026-08-18|Tue|FS0409|Sanjay Boopathy M|finance|10:06:00|00:00:00|834|50040
2026-08-18|Tue|FS0212|Santhosh Neelakandamoorthy|dev|09:45:00|09:57:00|12|720
2026-08-18|Tue|FS0442|Santhoshkumar Palanichamy|dev|09:48:00|10:03:00|15|900
2026-08-18|Tue|FS0106|Saravanan Devendhiran|dev|09:30:00|09:30:00|0|0
2026-08-18|Tue|FS0213|Sastihari Seenivasan|dev|09:45:00|10:20:00|35|2100
2026-08-18|Tue|FS0148|Selvaprakash Balan|dev|09:30:00|08:43:00|1392|83580
2026-08-18|Tue|FS0215|Shanmugam Mohanasundaram|dev|09:28:00|09:34:00|5|360
2026-08-18|Tue|FS0022|Shashti Priyan shathiyavelu|design|09:30:00|09:44:00|13|840
2026-08-18|Tue|FS0391|Shashwath Pasupathi|erp|09:48:00|09:48:00|0|0
2026-08-18|Tue|FS0037|Sivashankaran P|dev|09:45:00|09:51:00|5|360
2026-08-18|Tue|FS0038|Sooriya Balaji Iyappan|dev|00:06:00|00:21:00|15|900
2026-08-18|Tue|FS0324|Sowmya Prabhu|testing|09:56:00|10:26:00|30|1800
2026-08-18|Tue|FS0423|Sri Cibi Sivakumar|cyber|09:32:00|10:02:00|30|1800
2026-08-18|Tue|FS0329|Sridhar Kumar S|erp|00:50:00|00:50:00|0|0
2026-08-18|Tue|FS0085|Suryapriya Saravanan|dev|09:45:00|10:17:00|31|1920
2026-08-18|Tue|FS0430|Syed Riyas Niyas|cyber|09:30:00|10:05:00|35|2100
2026-08-18|Tue|FS0333|Theeban Babu S|dev|09:34:00|09:49:00|15|900
2026-08-18|Tue|FS0040|Veeravel Devaraj|ml|00:27:00|00:42:00|15|900
2026-08-18|Tue|FS0291|Vicky  Kumar|erp|09:13:00|09:18:00|4|300
2026-08-18|Tue|FS0325|Vijay Prakash A|testing|10:20:00|01:40:00|919|55200
2026-08-18|Tue|FS0239|VIJAY S R|testing|09:30:00|09:50:00|20|1200
2026-08-18|Tue|FS0353|Vishal Jayaraman|cyber|10:37:00|11:07:00|30|1800
2026-08-18|Tue|FS0408|Yogeshwaran Govindaraj|erp|09:38:00|09:38:00|0|0
2026-08-18|Tue|FS0090|Yogeswaran Murugavel|cyber|09:30:00|09:47:00|17|1020
2026-08-18|Tue|FS0407|Yuvaraj Santhanam|erp|09:48:00|10:23:00|34|2100
2026-08-19|Wed|FS0439|Abinesh Nagarajan|devops|10:06:00|10:21:00|15|900
2026-08-19|Wed|FS0414|Adam Gil Christ|it support|10:27:00|10:46:00|19|1140
2026-08-19|Wed|FS0190|Anurag Virendrakumar|devops|09:24:00|09:39:00|15|900
2026-08-19|Wed|FS0342|Ashraf A|testing|09:45:00|09:54:00|9|540
2026-08-19|Wed|FS0426|Astin Ravi|cyber|09:28:00|09:58:00|30|1800
2026-08-19|Wed|FS0194|Bharathi Arjunan|dev|09:51:00|10:06:00|15|900
2026-08-19|Wed|FS0377|Daniel Raj N|it support|10:10:00|10:10:00|0|0
2026-08-19|Wed|FS0277|Deepesh Raj B|dev|09:45:00|09:55:00|9|600
2026-08-19|Wed|FS0243|DELLIBABU T|finance|09:52:00|10:22:00|30|1800
2026-08-19|Wed|FS0281|Dhanalakshmi S|dev|09:26:00|09:31:00|4|300
2026-08-19|Wed|FS0101|Dhiwan Mariappan|finance|07:43:00|08:13:00|30|1800
2026-08-19|Wed|FS0311|Ganesh D|design|09:45:00|09:53:00|7|480
2026-08-19|Wed|FS0319|Gokulakannan Duraisamy|ml|09:30:00|10:15:00|45|2700
2026-08-19|Wed|FS0073|Gokulakannan Selvam|design|08:03:00|08:10:00|7|420
2026-08-19|Wed|FS0161|Haridha Muruganantham|erp|09:33:00|09:33:00|0|0
2026-08-19|Wed|FS0343|Hariharan Vijayakumar|erp|09:36:00|00:39:00|902|54180
2026-08-19|Wed|FS0399|Harthesh Murugan|finance|09:21:00|09:51:00|30|1800
2026-08-19|Wed|FS0036|Jai Surya S|design|09:05:00|09:28:00|22|1380
2026-08-19|Wed|FS0350|Janaki L|testing|11:05:00|11:35:00|30|1800
2026-08-19|Wed|FS0237|JONES  KAPIL L|testing|10:31:00|11:01:00|30|1800
2026-08-19|Wed|FS0289|Kantha  Kumar K|dev|09:22:00|09:26:00|4|240
2026-08-19|Wed|FS0200|Kavinkumar Ramasamy|dev|09:45:00|10:24:00|39|2340
2026-08-19|Wed|FS0397|Kishore Chandran|erp|09:03:00|09:03:00|0|0
2026-08-19|Wed|FS0323|Kishore M|devops|01:06:00|00:00:00|1373|82440
2026-08-19|Wed|FS0158|Kishore Theiveekan|dev|09:03:00|09:18:00|14|900
2026-08-19|Wed|FS0437|Lenci Manuela L|it support|10:43:00|10:51:00|8|480
2026-08-19|Wed|FST0022|Madhumitha Chandrasekaran|finance|08:35:00|09:05:00|30|1800
2026-08-19|Wed|FS0339|Magesh Kumar|cyber|10:01:00|10:43:00|41|2520
2026-08-19|Wed|FS0135|MAHESH T|cyber|03:01:00|03:31:00|30|1800
2026-08-19|Wed|FS0027|Manikadan P|design|10:50:00|10:55:00|5|300
2026-08-19|Wed|FS0133|maruthupandiyan mathuraiveeran|dev|09:30:00|09:48:00|17|1080
2026-08-19|Wed|FS0390|Naveen Prasad Moorthy|dev|09:04:00|09:10:00|5|360
2026-08-19|Wed|FS0371|Navin D|dev|09:45:00|10:14:00|29|1740
2026-08-19|Wed|FS0321|Nithyanantham V|devops|09:35:00|09:50:00|15|900
2026-08-19|Wed|FS0306|PRAKASH K|dev|09:02:00|09:17:00|15|900
2026-08-19|Wed|FS0322|Praveenkumar Saminathan|devops|11:19:00|11:34:00|15|900
2026-08-19|Wed|FS0209|Pravinabdulkalam Mathikannan|dev|10:36:00|10:44:00|8|480
2026-08-19|Wed|FST0011|Preethi Bernadath|finance|11:04:00|11:34:00|30|1800
2026-08-19|Wed|FS0405|Ragavendraprasath G|erp|09:29:00|09:29:00|0|0
2026-08-19|Wed|FS0210|Raghul Arumugam|design|06:54:00|13:38:00|404|24240
2026-08-19|Wed|FS0144|Ragul Priyan Murugan|dev|11:04:00|11:19:00|15|900
2026-08-19|Wed|FS0393|Raja Balaji A|erp|08:55:00|08:55:00|0|0
2026-08-19|Wed|FS0424|Rajesh Pannirselvame|cyber|09:03:00|09:33:00|30|1800
2026-08-19|Wed|FS0347|Ramachandran M D|erp|09:26:00|09:26:00|0|0
2026-08-19|Wed|FS0398|Ranganathan C|erp|09:21:00|09:26:00|5|300
2026-08-19|Wed|FS0400|Rexlin Felix S|erp|09:47:00|09:47:00|0|0
2026-08-19|Wed|FS0438|Sangeetha Balasubramanian|testing|09:52:00|10:22:00|30|1800
2026-08-19|Wed|FS0409|Sanjay Boopathy M|finance|10:28:00|03:09:00|1000|60060
2026-08-19|Wed|FS0334|Sarathi S S|testing|07:27:00|07:57:00|30|1800
2026-08-19|Wed|FS0031|Saravana Pandian S|design|09:45:00|09:48:00|2|180
2026-08-19|Wed|FS0106|Saravanan Devendhiran|dev|09:53:00|10:08:00|15|900
2026-08-19|Wed|FS0231|Saritha Sekar|risk|10:30:00|10:30:00|0|0
2026-08-19|Wed|FS0213|Sastihari Seenivasan|dev|07:29:00|07:44:00|15|900
2026-08-19|Wed|FS0125|Shahul Hameed Abdul Samad|risk|09:45:00|10:28:00|42|2580
2026-08-19|Wed|FS0215|Shanmugam Mohanasundaram|dev|09:36:00|09:41:00|4|300
2026-08-19|Wed|FS0022|Shashti Priyan shathiyavelu|design|08:49:00|08:49:00|0|0
2026-08-19|Wed|FS0391|Shashwath Pasupathi|erp|09:42:00|09:42:00|0|0
2026-08-19|Wed|FS0037|Sivashankaran P|dev|09:38:00|09:53:00|15|900
2026-08-19|Wed|FS0038|Sooriya Balaji Iyappan|dev|09:23:00|09:38:00|15|900
2026-08-19|Wed|FS0324|Sowmya Prabhu|testing|09:55:00|10:25:00|30|1800
2026-08-19|Wed|FS0423|Sri Cibi Sivakumar|cyber|09:45:00|10:24:00|38|2340
2026-08-19|Wed|FS0428|Sriganth Chennan|cyber|09:52:00|10:22:00|30|1800
2026-08-19|Wed|FS0318|Suresh Babu S|testing|09:40:00|01:04:00|924|55440
2026-08-19|Wed|FS0085|Suryapriya Saravanan|dev|11:27:00|11:42:00|15|900
2026-08-19|Wed|FS0430|Syed Riyas Niyas|cyber|10:01:00|10:31:00|30|1800
2026-08-19|Wed|FS0040|Veeravel Devaraj|ml|10:32:00|10:47:00|15|900
2026-08-19|Wed|FS0291|Vicky  Kumar|erp|09:31:00|09:31:00|0|0
2026-08-19|Wed|FS0325|Vijay Prakash A|testing|10:15:00|03:52:00|1057|63420
2026-08-19|Wed|FS0239|VIJAY S R|testing|10:56:00|10:15:00|1399|83940
2026-08-19|Wed|FS0353|Vishal Jayaraman|cyber|10:28:00|10:58:00|30|1800
2026-08-19|Wed|FS0219|Visvesvaran Kumaran|dev|09:45:00|10:10:00|24|1500
2026-08-19|Wed|FS0408|Yogeshwaran Govindaraj|erp|09:36:00|09:36:00|0|0
2026-08-19|Wed|FS0090|Yogeswaran Murugavel|cyber|10:01:00|10:31:00|30|1800
2026-08-19|Wed|FS0407|Yuvaraj Santhanam|erp|09:28:00|00:08:00|879|52800
2026-08-20|Thu|FS0439|Abinesh Nagarajan|devops|10:09:00|10:24:00|15|900
2026-08-20|Thu|FS0414|Adam Gil Christ|it support|10:23:00|12:01:00|98|5880
2026-08-20|Thu|FS0152|Ajith Kumar Ramalingam|dev|10:08:00|10:23:00|15|900
2026-08-20|Thu|FS0342|Ashraf A|testing|09:01:00|00:34:00|932|55980
2026-08-20|Thu|FS0194|Bharathi Arjunan|dev|09:43:00|09:58:00|15|900
2026-08-20|Thu|FS0377|Daniel Raj N|it support|10:13:00|10:13:00|0|0
2026-08-20|Thu|FS0243|DELLIBABU T|finance|09:37:00|10:07:00|30|1800
2026-08-20|Thu|FS0281|Dhanalakshmi S|dev|09:20:00|09:25:00|4|300
2026-08-20|Thu|FS0101|Dhiwan Mariappan|finance|07:45:00|08:15:00|30|1800
2026-08-20|Thu|FS0046|Divya Priya Senthilkumaran|pm|09:30:00|09:41:00|11|660
2026-08-20|Thu|FS0319|Gokulakannan Duraisamy|ml|11:21:00|11:36:00|15|900
2026-08-20|Thu|FS0073|Gokulakannan Selvam|design|07:53:00|08:00:00|6|420
2026-08-20|Thu|FS0161|Haridha Muruganantham|erp|09:38:00|09:38:00|0|0
2026-08-20|Thu|FS0343|Hariharan Vijayakumar|erp|09:28:00|01:07:00|938|56340
2026-08-20|Thu|FS0399|Harthesh Murugan|finance|09:20:00|09:50:00|30|1800
2026-08-20|Thu|FS0036|Jai Surya S|design|09:27:00|09:33:00|6|360
2026-08-20|Thu|FS0237|JONES  KAPIL L|testing|09:30:00|09:34:00|4|240
2026-08-20|Thu|FS0289|Kantha  Kumar K|dev|09:20:00|09:25:00|4|300
2026-08-20|Thu|FS0150|Karthikesan RajaRaman|dev|09:30:00|09:47:00|16|1020
2026-08-20|Thu|FS0397|Kishore Chandran|erp|09:01:00|09:01:00|0|0
2026-08-20|Thu|FS0323|Kishore M|devops|11:02:00|09:29:00|1347|80820
2026-08-20|Thu|FS0158|Kishore Theiveekan|dev|09:41:00|09:55:00|14|840
2026-08-20|Thu|FS0437|Lenci Manuela L|it support|10:11:00|10:19:00|8|480
2026-08-20|Thu|FST0022|Madhumitha Chandrasekaran|finance|09:26:00|09:56:00|30|1800
2026-08-20|Thu|FS0339|Magesh Kumar|cyber|09:51:00|12:20:00|148|8940
2026-08-20|Thu|FS0326|Mahasri Seenivasan|data|09:30:00|09:53:00|22|1380
2026-08-20|Thu|FS0135|MAHESH T|cyber|04:15:00|04:45:00|30|1800
2026-08-20|Thu|FS0027|Manikadan P|design|10:34:00|10:40:00|5|360
2026-08-20|Thu|FS0133|maruthupandiyan mathuraiveeran|dev|09:45:00|09:47:00|1|120
2026-08-20|Thu|FS0390|Naveen Prasad Moorthy|dev|09:06:00|09:12:00|5|360
2026-08-20|Thu|FS0371|Navin D|dev|09:08:00|09:23:00|15|900
2026-08-20|Thu|FS0321|Nithyanantham V|devops|09:15:00|09:30:00|15|900
2026-08-20|Thu|FS0306|PRAKASH K|dev|09:04:00|09:19:00|15|900
2026-08-20|Thu|FS0322|Praveenkumar Saminathan|devops|09:45:00|10:27:00|41|2520
2026-08-20|Thu|FS0209|Pravinabdulkalam Mathikannan|dev|10:43:00|11:15:00|32|1920
2026-08-20|Thu|FS0405|Ragavendraprasath G|erp|09:35:00|09:35:00|0|0
2026-08-20|Thu|FS0210|Raghul Arumugam|design|09:49:00|00:02:00|852|51180
2026-08-20|Thu|FS0144|Ragul Priyan Murugan|dev|09:30:00|10:05:00|34|2100
2026-08-20|Thu|FS0393|Raja Balaji A|erp|09:09:00|09:09:00|0|0
2026-08-20|Thu|FS0331|Rajesh Kumar A|testing|09:45:00|10:13:00|27|1680
2026-08-20|Thu|FS0424|Rajesh Pannirselvame|cyber|09:30:00|10:00:00|30|1800
2026-08-20|Thu|FS0347|Ramachandran M D|erp|09:07:00|09:07:00|0|0
2026-08-20|Thu|FS0398|Ranganathan C|erp|09:42:00|09:47:00|4|300
2026-08-20|Thu|FS0400|Rexlin Felix S|erp|09:52:00|09:52:00|0|0
2026-08-20|Thu|FS0438|Sangeetha Balasubramanian|testing|09:38:00|10:08:00|30|1800
2026-08-20|Thu|FS0409|Sanjay Boopathy M|finance|10:23:00|01:25:00|902|54120
2026-08-20|Thu|FS0334|Sarathi S S|testing|11:21:00|11:51:00|30|1800
2026-08-20|Thu|FS0031|Saravana Pandian S|design|10:42:00|10:42:00|0|0
2026-08-20|Thu|FS0106|Saravanan Devendhiran|dev|10:27:00|10:42:00|15|900
2026-08-20|Thu|FS0213|Sastihari Seenivasan|dev|09:38:00|09:53:00|15|900
2026-08-20|Thu|FS0215|Shanmugam Mohanasundaram|dev|09:36:00|09:40:00|4|240
2026-08-20|Thu|FS0391|Shashwath Pasupathi|erp|09:45:00|09:45:00|0|0
2026-08-20|Thu|FS0037|Sivashankaran P|dev|09:42:00|09:57:00|15|900
2026-08-20|Thu|FS0038|Sooriya Balaji Iyappan|dev|10:16:00|10:31:00|15|900
2026-08-20|Thu|FS0324|Sowmya Prabhu|testing|10:00:00|10:30:00|30|1800
2026-08-20|Thu|FS0428|Sriganth Chennan|cyber|10:10:00|10:40:00|30|1800
2026-08-20|Thu|FS0318|Suresh Babu S|testing|09:48:00|09:54:00|5|360
2026-08-20|Thu|FS0085|Suryapriya Saravanan|dev|10:55:00|11:10:00|15|900
2026-08-20|Thu|FS0430|Syed Riyas Niyas|cyber|09:55:00|10:25:00|30|1800
2026-08-20|Thu|FS0333|Theeban Babu S|dev|09:45:00|10:11:00|25|1560
2026-08-20|Thu|FS0040|Veeravel Devaraj|ml|01:49:00|02:04:00|15|900
2026-08-20|Thu|FS0291|Vicky  Kumar|erp|09:49:00|09:49:00|0|0
2026-08-20|Thu|FS0325|Vijay Prakash A|testing|10:17:00|03:23:00|1026|61560
2026-08-20|Thu|FS0239|VIJAY S R|testing|09:45:00|10:01:00|16|960
2026-08-20|Thu|FS0353|Vishal Jayaraman|cyber|09:51:00|10:21:00|30|1800
2026-08-20|Thu|FS0408|Yogeshwaran Govindaraj|erp|09:28:00|09:28:00|0|0
2026-08-20|Thu|FS0407|Yuvaraj Santhanam|erp|09:38:00|00:52:00|913|54840`;
