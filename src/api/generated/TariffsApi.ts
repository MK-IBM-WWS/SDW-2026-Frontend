/* eslint-disable */
/* tslint:disable */
// @ts-nocheck
/*
 * ---------------------------------------------------------------
 * ## THIS FILE WAS GENERATED VIA SWAGGER-TYPESCRIPT-API        ##
 * ##                                                           ##
 * ## AUTHOR: acacode                                           ##
 * ## SOURCE: https://github.com/acacode/swagger-typescript-api ##
 * ---------------------------------------------------------------
 */

export enum DsTariffStatus {
  StatusDraft = "черновик",
  StatusPublished = "опубликован",
  StatusDeleted = "удален",
}

export enum AuthRole {
  Creator = "creator",
  Moderator = "moderator",
}

export interface DsUser {
  /** Этим флагом управляет сервер или администратор БД; регистрация всегда ставит false. */
  is_moderator?: boolean;
  login?: string;
  user_id?: number;
}

export interface FeedMeta {
  batch_id?: string;
  batch_size?: number;
  batch_start?: number;
  position?: number;
  redis_key?: string;
  session_id?: string;
}

export interface HandlerCreatorResponse {
  login?: string;
  user_id?: number;
}

export interface HandlerCredentials {
  /** @example "student" */
  login?: string;
  /** @example "student123" */
  password?: string;
}

export interface HandlerDeleteData {
  deleted?: boolean;
}

export interface HandlerDeleteEnvelope {
  data?: HandlerDeleteData;
  /** @example "success" */
  status?: string;
}

export interface HandlerErrorEnvelope {
  message?: string;
  /** @example "fail" */
  status?: string;
}

export interface HandlerFeedEnvelope {
  data?: HandlerTariffResponse;
  feed?: FeedMeta;
  status?: string;
}

export interface HandlerLikeData {
  is_liked?: number;
  like_count?: number;
  tariff_id?: number;
}

export interface HandlerLikeEnvelope {
  data?: HandlerLikeData;
  /** @example "success" */
  status?: string;
}

export interface HandlerListEnvelope {
  data?: HandlerListTariffResponse[];
  index_enabled?: boolean;
  limit?: number;
  page?: number;
  query_ms?: number;
  /** @example "success" */
  status?: string;
  total?: number;
}

export interface HandlerListTariffResponse {
  created_at?: string;
  formed_at?: string;
  image_name?: string;
  image_url?: string;
  is_liked?: number;
  is_owner?: number;
  like_count?: number;
  price_per_month?: number;
  ram_gb?: number;
  short_description?: string;
  tariff_id?: number;
  tariff_name?: string;
  tariff_status?: DsTariffStatus;
  user_id?: number;
  video_name?: string;
  video_url?: string;
}

export interface HandlerLogoutData {
  logged_out?: boolean;
}

export interface HandlerLogoutEnvelope {
  data?: HandlerLogoutData;
  /** @example "success" */
  status?: string;
}

export interface HandlerTariffEnvelope {
  data?: HandlerTariffResponse;
  /** @example "success" */
  status?: string;
}

export interface HandlerTariffResponse {
  created_at?: string;
  creator?: HandlerCreatorResponse;
  /** ID автора, который сервер автоматически назначает из проверенного JWT при создании. */
  creator_id?: number;
  formed_at?: string;
  /**
   * Несмотря на старое Go-имя ImageURL, здесь хранится имя объекта MinIO.
   * В JSON оно называется image_name; действительная ссылка формируется отдельно в TariffResponse.
   */
  image_name?: string;
  image_url?: string;
  is_liked?: number;
  /** gorm:"-" означает, что поле не хранится в таблице. 1 — читатель является автором; 0 — нет. */
  is_owner?: number;
  like_count?: number;
  price_per_month?: number;
  ram_gb?: number;
  short_description?: string;
  tariff_id?: number;
  tariff_name?: string;
  tariff_status?: DsTariffStatus;
  video_name?: string;
  video_url?: string;
}

export interface HandlerTokenEnvelope {
  data?: HandlerTokenResponse;
  /** @example "success" */
  status?: string;
}

export interface HandlerTokenResponse {
  access_token?: string;
  /** @example 3600 */
  expires_in?: number;
  /** @example "creator" */
  role?: AuthRole;
  /** @example "Bearer" */
  token_type?: string;
  /** @example 1 */
  user_id?: number;
}

export interface HandlerUserEnvelope {
  data?: DsUser;
  /** @example "success" */
  status?: string;
}

export interface HandlerLikeRequest {
  /** @example 1 */
  value?: number;
}

import type {
  AxiosInstance,
  AxiosRequestConfig,
  AxiosResponse,
  HeadersDefaults,
  ResponseType,
} from "axios";
import axios from "axios";

export type QueryParamsType = Record<string | number, any>;

export interface FullRequestParams
  extends Omit<AxiosRequestConfig, "data" | "params" | "url" | "responseType"> {
  /** set parameter to `true` for call `securityWorker` for this request */
  secure?: boolean;
  /** request path */
  path: string;
  /** content type of request body */
  type?: ContentType;
  /** query params */
  query?: QueryParamsType;
  /** format of response (i.e. response.json() -> format: "json") */
  format?: ResponseType;
  /** request body */
  body?: unknown;
}

export type RequestParams = Omit<
  FullRequestParams,
  "body" | "method" | "query" | "path"
>;

export interface ApiConfig<SecurityDataType = unknown>
  extends Omit<AxiosRequestConfig, "data" | "cancelToken"> {
  securityWorker?: (
    securityData: SecurityDataType | null,
  ) => Promise<AxiosRequestConfig | void> | AxiosRequestConfig | void;
  secure?: boolean;
  format?: ResponseType;
}

export enum ContentType {
  Json = "application/json",
  JsonApi = "application/vnd.api+json",
  FormData = "multipart/form-data",
  UrlEncoded = "application/x-www-form-urlencoded",
  Text = "text/plain",
}

export class HttpClient<SecurityDataType = unknown> {
  public instance: AxiosInstance;
  private securityData: SecurityDataType | null = null;
  private securityWorker?: ApiConfig<SecurityDataType>["securityWorker"];
  private secure?: boolean;
  private format?: ResponseType;

  constructor({
    securityWorker,
    secure,
    format,
    ...axiosConfig
  }: ApiConfig<SecurityDataType> = {}) {
    this.instance = axios.create({
      ...axiosConfig,
      baseURL: axiosConfig.baseURL || "/api",
    });
    this.secure = secure;
    this.format = format;
    this.securityWorker = securityWorker;
  }

  public setSecurityData = (data: SecurityDataType | null) => {
    this.securityData = data;
  };

  protected mergeRequestParams(
    params1: AxiosRequestConfig,
    params2?: AxiosRequestConfig,
  ): AxiosRequestConfig {
    const method = params1.method || (params2 && params2.method);

    return {
      ...this.instance.defaults,
      ...params1,
      ...(params2 || {}),
      headers: {
        ...((method &&
          this.instance.defaults.headers[
            method.toLowerCase() as keyof HeadersDefaults
          ]) ||
          {}),
        ...(params1.headers || {}),
        ...((params2 && params2.headers) || {}),
      },
    };
  }

  protected stringifyFormItem(formItem: unknown) {
    if (typeof formItem === "object" && formItem !== null) {
      return JSON.stringify(formItem);
    } else {
      return `${formItem}`;
    }
  }

  protected createFormData(input: Record<string, unknown>): FormData {
    if (input instanceof FormData) {
      return input;
    }
    return Object.keys(input || {}).reduce((formData, key) => {
      const property = input[key];
      const propertyContent: any[] =
        property instanceof Array ? property : [property];

      for (const formItem of propertyContent) {
        const isFileType = formItem instanceof Blob || formItem instanceof File;
        formData.append(
          key,
          isFileType ? formItem : this.stringifyFormItem(formItem),
        );
      }

      return formData;
    }, new FormData());
  }

  public request = async <T = any, _E = any>({
    secure,
    path,
    type,
    query,
    format,
    body,
    ...params
  }: FullRequestParams): Promise<AxiosResponse<T>> => {
    const secureParams =
      ((typeof secure === "boolean" ? secure : this.secure) &&
        this.securityWorker &&
        (await this.securityWorker(this.securityData))) ||
      {};
    const requestParams = this.mergeRequestParams(params, secureParams);
    const responseFormat = format || this.format || undefined;

    if (
      type === ContentType.FormData &&
      body &&
      body !== null &&
      typeof body === "object"
    ) {
      body = this.createFormData(body as Record<string, unknown>);
    }

    if (
      type === ContentType.Text &&
      body &&
      body !== null &&
      typeof body !== "string"
    ) {
      body = JSON.stringify(body);
    }

    return this.instance.request({
      ...requestParams,
      headers: {
        ...(requestParams.headers || {}),
        ...(type ? { "Content-Type": type } : {}),
      },
      params: query,
      responseType: responseFormat,
      data: body,
      url: path,
    });
  };
}

/**
 * @title Cloud Tariffs API
 * @version 4.0
 * @baseUrl /api
 * @contact
 *
 * Каталог облачных тарифов. Публичное чтение, JWT для методов создателя. Регистрация и вход доступны без JWT.
 */
export class TariffsApi<
  SecurityDataType extends unknown,
> extends HttpClient<SecurityDataType> {
  tariffs = {
    /**
     * @description Сортировка price_per_month, tariff_id; query_ms — время COUNT и SELECT, без HTTP/MinIO. Максимум 100 карточек за запрос.
     *
     * @tags Тарифы
     * @name GetTariffs
     * @summary Страница опубликованных тарифов с фильтром цены
     * @request GET:/tariffs
     */
    getTariffs: (
      query?: {
        /**
         * Максимальная цена
         * @min 0
         */
        priceLimit?: number;
        /**
         * Страница
         * @min 1
         * @default 1
         */
        page?: number;
        /**
         * Размер страницы
         * @min 1
         * @max 100
         * @default 10
         */
        limit?: number;
      },
      params: RequestParams = {},
    ) =>
      this.request<HandlerListEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Тарифы
     * @name CreateTariff
     * @summary Создать черновик с фото и видео
     * @request POST:/tariffs
     * @secure
     */
    createTariff: (
      data: {
        /** Название, 1–100 символов */
        tariff_name: string;
        /**
         * Фото JPEG/PNG/GIF/WebP, до 10 MiB
         * @format binary
         */
        image?: File;
        /**
         * Видео MP4/WebM, до 50 MiB
         * @format binary
         */
        video?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<HandlerTariffEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs`,
        method: "POST",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Тарифы
     * @name GetTariffDraft
     * @summary Единственный черновик текущего пользователя
     * @request GET:/tariffs/draft
     * @secure
     */
    getTariffDraft: (params: RequestParams = {}) =>
      this.request<HandlerTariffEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs/draft`,
        method: "GET",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * @description При первом обращении создаёт 100 уникальных карточек. Сессия feed_session — HttpOnly cookie без авторизации, TTL Redis 24 часа. position — сквозной номер. init не продвигает ленту.
     *
     * @tags Тарифы
     * @name GetTariffFeed
     * @summary Карточка случайной ленты из Redis
     * @request GET:/tariffs/feed
     */
    getTariffFeed: (
      query?: {
        /**
         * Порядковый номер в текущем наборе или сразу после него
         * @min 1
         */
        position?: number;
        /** Сформировать/восстановить ленту при старте приложения */
        init?: boolean;
        /**
         * Открыть карточку из плитки
         * @min 1
         */
        id?: number;
        /** Следующая в Redis-порядке после id */
        next?: boolean;
      },
      params: RequestParams = {},
    ) =>
      this.request<HandlerFeedEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs/feed`,
        method: "GET",
        query: query,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Тарифы
     * @name DeleteTariff
     * @summary Логически удалить свой тариф
     * @request DELETE:/tariffs/{id}
     * @secure
     */
    deleteTariff: (id: number, params: RequestParams = {}) =>
      this.request<HandlerDeleteEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs/${id}`,
        method: "DELETE",
        secure: true,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Тарифы
     * @name SetTariffLike
     * @summary Поставить или отменить свой лайк
     * @request POST:/tariffs/{id}/likes
     * @secure
     */
    setTariffLike: (
      id: number,
      body: HandlerLikeRequest,
      params: RequestParams = {},
    ) =>
      this.request<HandlerLikeEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs/${id}/likes`,
        method: "POST",
        body: body,
        secure: true,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Тарифы
     * @name PublishTariff
     * @summary Опубликовать свой черновик
     * @request PUT:/tariffs/{id}/publication
     * @secure
     */
    publishTariff: (
      id: number,
      data: {
        /** Название, 1–100 символов */
        tariff_name: string;
        /** Описание, 1–500 символов */
        short_description: string;
        /** Цена >= 0 */
        price_per_month: number;
        /** RAM > 0 */
        ram_gb: number;
        /** Новое фото, до 10 МБ; без файла сохраняется прежнее */
        image?: File;
        /** Новое видео, до 50 МБ; без файла сохраняется прежнее */
        video?: File;
      },
      params: RequestParams = {},
    ) =>
      this.request<HandlerTariffEnvelope, HandlerErrorEnvelope>({
        path: `/tariffs/${id}/publication`,
        method: "PUT",
        body: data,
        secure: true,
        type: ContentType.FormData,
        format: "json",
        ...params,
      }),
  };
  users = {
    /**
     * No description
     *
     * @tags Пользователи
     * @name RegisterTariffUser
     * @summary Зарегистрировать пользователя
     * @request POST:/users
     */
    registerTariffUser: (
      body: HandlerCredentials,
      params: RequestParams = {},
    ) =>
      this.request<HandlerUserEnvelope, HandlerErrorEnvelope>({
        path: `/users`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Пользователи
     * @name LoginTariffUser
     * @summary Войти и получить JWT
     * @request POST:/users/login
     */
    loginTariffUser: (body: HandlerCredentials, params: RequestParams = {}) =>
      this.request<HandlerTokenEnvelope, HandlerErrorEnvelope>({
        path: `/users/login`,
        method: "POST",
        body: body,
        type: ContentType.Json,
        format: "json",
        ...params,
      }),

    /**
     * No description
     *
     * @tags Пользователи
     * @name LogoutTariffUser
     * @summary Выйти и отозвать текущий JWT
     * @request POST:/users/logout
     * @secure
     */
    logoutTariffUser: (params: RequestParams = {}) =>
      this.request<HandlerLogoutEnvelope, HandlerErrorEnvelope>({
        path: `/users/logout`,
        method: "POST",
        secure: true,
        format: "json",
        ...params,
      }),
  };
}
