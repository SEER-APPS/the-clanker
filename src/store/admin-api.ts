import { createApi } from "@reduxjs/toolkit/query/react";
import type { AdminMe, DashboardPayload, Paginated } from "@/types/admin";
import { adminJsonBaseQuery } from "@/store/admin-base-query";

export const adminApi = createApi({
  reducerPath: "adminApi",
  baseQuery: adminJsonBaseQuery,
  tagTypes: [
    "Me",
    "Dashboard",
    "Users",
    "ThreatAlerts",
    "Conversations",
    "Notifications",
    "SchoolFees",
    "Tickets",
    "Passport",
    "Permit",
    "Hubtel",
    "Settings",
    "Staff",
    "Balances",
  ],
  endpoints: (builder) => ({
    getMe: builder.query<{ admin: AdminMe }, void>({
      query: () => "/auth/me",
      providesTags: ["Me"],
    }),
    getDashboard: builder.query<DashboardPayload, void>({
      query: () => "/dashboard",
      providesTags: ["Dashboard"],
    }),
    getUsers: builder.query<
      Paginated<Record<string, unknown>>,
      { page?: number; search?: string; status?: string }
    >({
      query: (params) => ({ url: "/users", params }),
      providesTags: ["Users"],
    }),
    getUser: builder.query<{ user: Record<string, unknown> }, number>({
      query: (id) => `/users/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Users", id }],
    }),
    blockUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}/block`, method: "POST" }),
      invalidatesTags: ["Users", "Dashboard"],
    }),
    unblockUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}/unblock`, method: "POST" }),
      invalidatesTags: ["Users", "Dashboard"],
    }),
    deleteUser: builder.mutation<void, number>({
      query: (id) => ({ url: `/users/${id}`, method: "DELETE" }),
      invalidatesTags: ["Users", "Dashboard"],
    }),
    getThreatAlerts: builder.query<
      Paginated<Record<string, unknown>> & { filters?: Record<string, unknown> },
      { page?: number; status?: string; type?: string; search?: string }
    >({
      query: (params) => ({ url: "/threat-alerts", params }),
      providesTags: ["ThreatAlerts"],
    }),
    getThreatAlert: builder.query<{ alert: Record<string, unknown> }, number>({
      query: (id) => `/threat-alerts/${id}`,
      providesTags: (_r, _e, id) => [{ type: "ThreatAlerts", id }],
    }),
    getConversations: builder.query<Paginated<Record<string, unknown>>, { page?: number; type?: string }>(
      {
        query: (params) => ({ url: "/conversations", params }),
        providesTags: ["Conversations"],
      },
    ),
    getConversation: builder.query<{ conversation: Record<string, unknown> }, number>({
      query: (id) => `/conversations/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Conversations", id }],
    }),
    getNotifications: builder.query<
      Paginated<Record<string, unknown>> & { filters?: Record<string, unknown> },
      { page?: number; status?: string; event_type?: string; search?: string }
    >({
      query: (params) => ({ url: "/notifications", params }),
      providesTags: ["Notifications"],
    }),
    getReloadlyAirtime: builder.query<Record<string, unknown>, { page?: number }>({
      query: (params) => ({ url: "/services/reloadly/airtime", params }),
    }),
    getReloadlyPrepaid: builder.query<Record<string, unknown>, { page?: number }>({
      query: (params) => ({ url: "/services/reloadly/prepaid", params }),
    }),
    getReloadlyOperators: builder.query<
      { countryIso: string; operators: unknown; mappings: unknown },
      { countryIso?: string }
    >({
      query: (params) => ({ url: "/services/reloadly/operators", params }),
    }),
    saveOperatorMappings: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({
        url: "/services/reloadly/operator-mappings",
        method: "POST",
        body,
      }),
    }),
    getServiceTestsMeta: builder.query<Record<string, unknown>, void>({
      query: () => "/services/tests/meta",
    }),
    postServiceTestAirtime: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/tests/airtime", method: "POST", body }),
    }),
    postServiceTestBundles: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/tests/bundles", method: "POST", body }),
    }),
    postServiceTestDataTopup: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/tests/data-topup", method: "POST", body }),
    }),
    getAnalytics: builder.query<Record<string, unknown>, void>({
      query: () => "/services/analytics",
    }),
    getAnalyticsLogs: builder.query<Record<string, unknown>, { page?: number }>({
      query: (params) => ({ url: "/services/analytics/logs", params }),
    }),
    getAnalyticsFailures: builder.query<
      Record<string, unknown>,
      { page?: number; product?: string; search?: string; per_page?: number }
    >({
      query: (params) => ({ url: "/services/analytics/failures", params }),
    }),
    getSchoolFees: builder.query<Paginated<Record<string, unknown>>, { page?: number }>({
      query: (params) => ({ url: "/services/school-fees", params }),
      providesTags: ["SchoolFees"],
    }),
    getSchoolFee: builder.query<{ request: Record<string, unknown> }, number>({
      query: (id) => `/services/school-fees/${id}`,
      providesTags: (_r, _e, id) => [{ type: "SchoolFees", id }],
    }),
    updateSchoolFeeStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/services/school-fees/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["SchoolFees"],
    }),
    getTickets: builder.query<Paginated<Record<string, unknown>>, { page?: number }>({
      query: (params) => ({ url: "/services/tickets", params }),
      providesTags: ["Tickets"],
    }),
    getTicket: builder.query<{ booking: Record<string, unknown> }, number>({
      query: (id) => `/services/tickets/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Tickets", id }],
    }),
    updateTicketStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/services/tickets/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Tickets"],
    }),
    getPassportApps: builder.query<Paginated<Record<string, unknown>>, { page?: number }>({
      query: (params) => ({ url: "/services/passport", params }),
      providesTags: ["Passport"],
    }),
    getPassportApp: builder.query<{ application: Record<string, unknown> }, number>({
      query: (id) => `/services/passport/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Passport", id }],
    }),
    updatePassportStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/services/passport/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Passport"],
    }),
    getPermitApps: builder.query<Paginated<Record<string, unknown>>, { page?: number }>({
      query: (params) => ({ url: "/services/permit", params }),
      providesTags: ["Permit"],
    }),
    getPermitApp: builder.query<{ application: Record<string, unknown> }, number>({
      query: (id) => `/services/permit/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Permit", id }],
    }),
    updatePermitStatus: builder.mutation<unknown, { id: number; body: Record<string, unknown> }>({
      query: ({ id, body }) => ({
        url: `/services/permit/${id}/status`,
        method: "POST",
        body,
      }),
      invalidatesTags: ["Permit"],
    }),
    getDataCatalogue: builder.query<Record<string, unknown>, void>({
      query: () => "/services/data-catalogue",
    }),
    postDataCatalogueFetch: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/data-catalogue/fetch", method: "POST", body }),
    }),
    postDataCatalogueFind: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/data-catalogue/find", method: "POST", body }),
    }),
    getBalances: builder.query<Record<string, unknown>, void>({
      query: () => "/services/balances",
      providesTags: ["Balances"],
    }),
    getReloadlyBalance: builder.query<Record<string, unknown>, void>({
      query: () => "/services/balances/reloadly",
      providesTags: ["Balances"],
    }),
    postVerifyNumber: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({
        url: "/services/balances/verify-number",
        method: "POST",
        body,
      }),
    }),
    getHubtelSummary: builder.query<Record<string, unknown>, void>({
      query: () => "/services/hubtel/summary",
      providesTags: ["Hubtel"],
    }),
    getHubtelTransactions: builder.query<
      Record<string, unknown>,
      Record<string, string | boolean | number | undefined>
    >({
      query: (params) => ({ url: "/services/hubtel/transactions", params }),
      providesTags: ["Hubtel"],
    }),
    getHubtelTransaction: builder.query<Record<string, unknown>, string | number>({
      query: (id) => `/services/hubtel/transactions/${id}`,
      providesTags: (_r, _e, id) => [{ type: "Hubtel", id: String(id) }],
    }),
    deleteHubtelTransaction: builder.mutation<unknown, string | number>({
      query: (id) => ({ url: `/services/hubtel/transactions/${id}`, method: "DELETE" }),
      invalidatesTags: ["Hubtel"],
    }),
    archiveHubtelTransaction: builder.mutation<unknown, string | number>({
      query: (id) => ({
        url: `/services/hubtel/transactions/${id}/archive`,
        method: "POST",
      }),
      invalidatesTags: ["Hubtel"],
    }),
    refreshHubtelTransaction: builder.mutation<unknown, string | number>({
      query: (id) => ({
        url: `/services/hubtel/transactions/${id}/refresh-status`,
        method: "POST",
      }),
      invalidatesTags: ["Hubtel"],
    }),
    hubtelBatchDelete: builder.mutation<unknown, { ids: number[] }>({
      query: (body) => ({
        url: "/services/hubtel/transactions/batch-delete",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hubtel"],
    }),
    hubtelBatchArchive: builder.mutation<unknown, { ids: number[] }>({
      query: (body) => ({
        url: "/services/hubtel/transactions/batch-archive",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hubtel"],
    }),
    hubtelBatchRefreshStatus: builder.mutation<unknown, { ids: number[] }>({
      query: (body) => ({
        url: "/services/hubtel/transactions/batch-refresh-status",
        method: "POST",
        body,
      }),
      invalidatesTags: ["Hubtel"],
    }),
    hubtelTestSms: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/sms", method: "POST", body }),
    }),
    hubtelTestSmsBatch: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/sms-batch", method: "POST", body }),
    }),
    hubtelTestAirtime: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/airtime", method: "POST", body }),
    }),
    hubtelQueryBundles: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/query/bundles", method: "POST", body }),
    }),
    hubtelTestDataBundle: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/data-bundle", method: "POST", body }),
    }),
    hubtelQueryUtility: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/query/utility", method: "POST", body }),
    }),
    hubtelTestUtility: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/utility", method: "POST", body }),
    }),
    hubtelTestTv: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/tv", method: "POST", body }),
    }),
    hubtelTestCheckout: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/tests/checkout", method: "POST", body }),
    }),
    hubtelStatusCheck: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/status-check", method: "POST", body }),
    }),
    hubtelRefund: builder.mutation<unknown, Record<string, unknown>>({
      query: (body) => ({ url: "/services/hubtel/refund", method: "POST", body }),
    }),
    hubtelSyncPending: builder.mutation<unknown, void>({
      query: () => ({ url: "/services/hubtel/sync-pending", method: "POST" }),
    }),
    getSettings: builder.query<{ admin: AdminMe }, void>({
      query: () => "/settings",
      providesTags: ["Settings", "Me"],
    }),
    updateProfile: builder.mutation<unknown, { name: string; email: string }>({
      query: (body) => ({ url: "/settings/profile", method: "PUT", body }),
      invalidatesTags: ["Settings", "Me"],
    }),
    updatePassword: builder.mutation<
      unknown,
      { current_password: string; password: string; password_confirmation: string }
    >({
      query: (body) => ({ url: "/settings/password", method: "POST", body }),
    }),
    updatePhoto: builder.mutation<unknown, FormData>({
      query: (body) => ({ url: "/settings/photo", method: "POST", body }),
      invalidatesTags: ["Settings", "Me"],
    }),
    removePhoto: builder.mutation<unknown, void>({
      query: () => ({ url: "/settings/photo", method: "DELETE" }),
      invalidatesTags: ["Settings", "Me"],
    }),
    getStaffAdmins: builder.query<{ admins: Record<string, unknown>[] }, void | undefined>({
      query: () => "/staff/admins",
      providesTags: ["Staff"],
    }),
    createStaffAdmin: builder.mutation<
      unknown,
      { name: string; email: string; password: string; password_confirmation: string }
    >({
      query: (body) => ({ url: "/staff/admins", method: "POST", body }),
      invalidatesTags: ["Staff"],
    }),
    changeStaffRole: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/staff/admins/${id}/role`, method: "POST" }),
      invalidatesTags: ["Staff"],
    }),
    deleteStaffAdmin: builder.mutation<unknown, number>({
      query: (id) => ({ url: `/staff/admins/${id}`, method: "DELETE" }),
      invalidatesTags: ["Staff"],
    }),
  }),
});

export const {
  useGetMeQuery,
  useGetDashboardQuery,
  useGetUsersQuery,
  useGetUserQuery,
  useBlockUserMutation,
  useUnblockUserMutation,
  useDeleteUserMutation,
  useGetThreatAlertsQuery,
  useGetThreatAlertQuery,
  useGetConversationsQuery,
  useGetConversationQuery,
  useGetNotificationsQuery,
  useGetReloadlyAirtimeQuery,
  useGetReloadlyPrepaidQuery,
  useGetReloadlyOperatorsQuery,
  useSaveOperatorMappingsMutation,
  useGetServiceTestsMetaQuery,
  usePostServiceTestAirtimeMutation,
  usePostServiceTestBundlesMutation,
  usePostServiceTestDataTopupMutation,
  useGetAnalyticsQuery,
  useGetAnalyticsLogsQuery,
  useGetAnalyticsFailuresQuery,
  useGetSchoolFeesQuery,
  useGetSchoolFeeQuery,
  useUpdateSchoolFeeStatusMutation,
  useGetTicketsQuery,
  useGetTicketQuery,
  useUpdateTicketStatusMutation,
  useGetPassportAppsQuery,
  useGetPassportAppQuery,
  useUpdatePassportStatusMutation,
  useGetPermitAppsQuery,
  useGetPermitAppQuery,
  useUpdatePermitStatusMutation,
  useGetDataCatalogueQuery,
  usePostDataCatalogueFetchMutation,
  usePostDataCatalogueFindMutation,
  useGetBalancesQuery,
  useGetReloadlyBalanceQuery,
  usePostVerifyNumberMutation,
  useGetHubtelSummaryQuery,
  useGetHubtelTransactionsQuery,
  useGetHubtelTransactionQuery,
  useDeleteHubtelTransactionMutation,
  useArchiveHubtelTransactionMutation,
  useRefreshHubtelTransactionMutation,
  useHubtelBatchDeleteMutation,
  useHubtelBatchArchiveMutation,
  useHubtelBatchRefreshStatusMutation,
  useHubtelTestSmsMutation,
  useHubtelTestSmsBatchMutation,
  useHubtelTestAirtimeMutation,
  useHubtelQueryBundlesMutation,
  useHubtelTestDataBundleMutation,
  useHubtelQueryUtilityMutation,
  useHubtelTestUtilityMutation,
  useHubtelTestTvMutation,
  useHubtelTestCheckoutMutation,
  useHubtelStatusCheckMutation,
  useHubtelRefundMutation,
  useHubtelSyncPendingMutation,
  useGetSettingsQuery,
  useUpdateProfileMutation,
  useUpdatePasswordMutation,
  useUpdatePhotoMutation,
  useRemovePhotoMutation,
  useGetStaffAdminsQuery,
  useCreateStaffAdminMutation,
  useChangeStaffRoleMutation,
  useDeleteStaffAdminMutation,
} = adminApi;
