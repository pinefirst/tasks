const axios = require("axios");


class Client {
  constructor() {
    this.token = "";
    this.id = "";
    this.loan_id = "";
    this.context = null;
    this.protocol = "http:";
    this.port = null;
  }

   

  setLoanId(id) {
    return new Promise((resolve, reject) => {
      this.loan_id = id;
      resolve("success");
    });
  }

  setId(id) {
    return new Promise((resolve, reject) => {
      this.id = id;
      resolve("success");
    });
  }

  getLoanId() {
    return this.loan_id;
  }

  getId() {
    return this.id;
  }

  getToken() {
    return this.token;
  }

  setToken(token) {
    return new Promise((resolve, reject) => {
      this.token = token;
      resolve("success");
    });
  }

  setContext(context) {
    this.context = context;
  }

  detectContext() {
    if (typeof window !== "undefined") {
      this.host = window.location.hostname;
      this.protocol = window.location.protocol;
      this.port = window.location.port;
    } else {
      if (this.context && this.context.req) {
        this.host = this.context.req.headers.host;

        if (this.context.req && this.context.req.connection) {
          this.protocol = this.context.req.connection.encrypted
            ? "https:"
            : "http:";
        }
      }
    }
  }

  async makeRequest(method, url, data, isBlob = "") {
    return new Promise(async (resolve, reject) => {
      this.detectContext();
      let requestData = data || {};
      let baseUrl = this.getBaseUrl();
      let requestUrl = baseUrl + url;

      try {
        const response = await axios(requestUrl, {
          credentials: "include",
          headers: {
            "content-type":
              method === "post" || method === "delete" || method === "put"
                ? "application/json"
                : "",
            Authorization: this.token ? `Bearer ${this.token}` : "",
            Id: this.id,
            LoanId: this.loan_id,
          },
          responseType: isBlob,
          method: method,
          data: {
            ...requestData,
          },
        });

        let data = response.data;
        if (data.success === -10) {
          try {
            const store = await require("../Reducers").default;
            await store.dispatch(authActions.Logout());
            setTimeout(() => {
              history.push(`/login`);
              resolve({
                success: -1,
              });
            }, 100);
          } catch (error) {}
        } else {
          resolve(data);
        }
      } catch (err) {
        try {
          if (err.response.status === 401) {
            const store = await require("../Reducers").default;
            await store.dispatch(authActions.Logout());
            setTimeout(() => {
              history.push(`/login`);
              resolve({
                success: -1,
              });
            }, 100);
          }
        } catch (err) {
          resolve({
            success: 0,
            messages: [err],
          });
        }
      }
    });
  }

  async makeUpload(method, url, data) {
    let requestData = data;
    return new Promise(async (resolve, reject) => {
      this.detectContext();
      let baseUrl = this.getBaseUrl();
      let requestUrl = baseUrl + url;

      try {
        const response = await axios(requestUrl, {
          headers: {
            "Content-Type": "multipart/form-data",
            Authorization: this.token ? `Bearer ${this.token}` : "",
            Id: this.id,
            LoanId: this.loan_id,
          },
          method: method,
          data: requestData,
        });

        let data = response.data;
        resolve(data);
      } catch (err) {
        resolve({
          success: 0,
          messages: [err],
        });
      }
    });
  }

  getBaseUrl(port = true) {
    return process.env.REACT_APP_API_URL
      ? process.env.REACT_APP_API_URL
      : `${this.protocol}//${this.host}${
          port && this.port ? ":" + this.port : ""
        }`;
  }
}

export default new Client();

// All Api contain messages
// { success: x, messages: [], data: {}}
// success 0 => error happen,
// success -1 => require login
// success 1 => success, backend
