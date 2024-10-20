const DetalleVenta = require("../models/documents/DetalleVenta");
const Venta = require("../models/documents/Venta");
const Tenant = require("../models/global/Tenant");
const Entidad = require("../models/users/Entidad");
const fs = require("fs");
const path = require("path");
const forge = require("node-forge");
const moment = require("moment");
const { XMLBuilder } = require("fast-xml-parser");
const xmlFormatter = require("xml-formatter");

const crypto = require("crypto");
const zip = require("adm-zip");
const axios = require("axios");
const { SignedXml } = require("xml-crypto");

const { DOMParser, XMLSerializer } = require("@xmldom/xmldom"); // Importar desde el paquete moderno
class Sunat {
  constructor() {
    this.venta = null; // Inicialmente no se carga la venta
    this.tenant = null;
  }

  // Método asíncrono para cargar la venta
  async loadVenta(id, tenantId) {
    this.venta = await Venta.findOne({
      where: { id, tenantId: tenantId },
      include: [
        { model: DetalleVenta, as: "detalleventa" },
        { model: Entidad, as: "entidadClienteVenta" },
      ],
    });
    this.tenant = await Tenant.findByPk(tenantId);

    this.nombreXML = `${this.tenant.ruc}-01-${this.venta.documento}`;
    this.rutaXML = path.join(
      __dirname,
      "../../public/documents/xml/",
      `${this.nombreXML}.xml`
    );
    console.log("RUTA XML: ", this.rutaXML);
  }

  // Método para retornar la venta
  getVenta() {
    return this.venta;
  }
  getTenant() {
    return this.tenant;
  }
  // Método para realizar el proceso completo
  async proceso() {
    if (!this.venta) {
      throw new Error(
        "Venta no cargada. Llama a 'loadVenta' antes de procesar."
      );
    }

    await this.generateXML();
    await this.firmarXML();
    await this.comprimiXML();
    const response = await this.sendXML();
    return response;
  }
  async generateXML() {
    try {
      // Crear el directorio si no existe
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      console.log("-------------------GENERANDO XML-------------------");
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      const dir = path.dirname(this.rutaXML);
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
      }

      // Configuración del fast-xml-parser
      const options = {
        ignoreAttributes: false,
        format: true,
      };

      /* Formatear las fechas y horas
      const issueDate = moment(venta.fecha_emision).format("YYYY-MM-DD");
      const issueTime = moment(venta.hora_emision, "HH:mm:ss").format(
        "HH:mm:ss"
      );
*/
      // Extraer la fecha (YYYY-MM-DD)
      const issueDate = moment(this.venta.fecha_emision).format("YYYY-MM-DD");

      // Extraer la hora (HH:mm:ss)
      const issueTime = moment(this.venta.fecha_emision).format("HH:mm:ss");
      const dueDate = moment(this.venta.fecha_vencimiento).format("YYYY-MM-DD");
      // Crear el objeto XML con los datos del comprobante
      const xmlData = {
        "?xml": {
          "@_version": "1.0",
          "@_encoding": "utf-8",
        },

        Invoice: {
          "@_xmlns:xsi": "http://www.w3.org/2001/XMLSchema-instance",
          "@_xmlns:xsd": "http://www.w3.org/2001/XMLSchema",
          "@_xmlns:cac":
            "urn:oasis:names:specification:ubl:schema:xsd:CommonAggregateComponents-2",
          "@_xmlns:cbc":
            "urn:oasis:names:specification:ubl:schema:xsd:CommonBasicComponents-2",
          "@_xmlns:ccts": "urn:un:unece:uncefact:documentation:2",
          "@_xmlns:ds": "http://www.w3.org/2000/09/xmldsig#",
          "@_xmlns:ext":
            "urn:oasis:names:specification:ubl:schema:xsd:CommonExtensionComponents-2",
          "@_xmlns:qdt":
            "urn:oasis:names:specification:ubl:schema:xsd:QualifiedDatatypes-2",
          "@_xmlns:udt":
            "urn:un:unece:uncefact:data:specification:UnqualifiedDataTypesSchemaModule:2",
          "@_xmlns": "urn:oasis:names:specification:ubl:schema:xsd:Invoice-2",
          /*
          "ext:UBLExtensions": {
            "ext:UBLExtension": {
              "ext:ExtensionContent": "", // Aquí se incluirá la firma digital
            },
          },*/
          "ext:UBLExtensions": {
            /*
            "ext:UBLExtension": {
              "ext:ExtensionContent": {
                "sac:AdditionalInformation": {
                  "sac:AdditionalMonetaryTotal": {
                    "cbc:ID": "1001",
                    "cbc:PayableAmount": {
                      "@_currencyID": "PEN",
                      "#text": this.venta.total,
                    },
                  },
                  "sac:AdditionalProperty": {
                    "cbc:ID": "1000",
                    "cbc:Value": "DOSCIENTOS CUARENTA Y 00/100",
                  },
                },
              },
            },
            */
            "ext:UBLExtension": {
              "ext:ExtensionContent": "",
            },
          },
          "cbc:UBLVersionID": "2.1",
          "cbc:CustomizationID": {
            "@_schemeAgencyName": "PE:SUNAT",
            "#text": "2.0",
          },
          "cbc:ProfileID": {
            "@_schemeName": "Tipo de Operacion",
            "@_schemeAgencyName": "PE:SUNAT",
            "@_schemeURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo51",
            "#text": "01", // Código de tipo de Operación | catálogo 51 es venta interna
            //posible cambio 0101
          },
          "cbc:ID": `${this.venta.documento}`,
          "cbc:IssueDate": issueDate,
          "cbc:IssueTime": issueTime,
          "cbc:DueDate": dueDate,

          //'cbc:InvoiceTypeCode': '01', // Tipo de documento: Factura
          "cbc:InvoiceTypeCode": {
            "@_listAgencyName": "PE:SUNAT",
            "@_listName": "Tipo de Documento",
            "@_listURI": "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo01",
            "@_listID": "0101",
            "@_name": "Tipo de Operacion",
            "#text": "01", // Código de tipo de documento (Factura)
          },
          "cbc:Note": {
            "@_languageLocaleID": "1000",
            "#text": "DOSCIENTOS CUARENTA Y 00/100",
          },
          //'cbc:DocumentCurrencyCode': 'PEN', // Moneda
          "cbc:DocumentCurrencyCode": {
            "@_listID": "ISO 4217 Alpha",
            "@_listName": "Currency",
            "@_listAgencyName": "United Nations Economic Commission for Europe",
            "#text": "PEN", // Código de moneda
          },
          "cbc:LineCountNumeric": this.venta.detalleventa.length, // Cantidad de líneas de detalle

          // Nuevo:
          "cac:Signature": {
            "cbc:ID": `${this.venta.documento}`, // ID de la firma
            "cac:SignatoryParty": {
              "cac:PartyIdentification": {
                "cbc:ID": this.tenant.ruc, // RUC del emisor
              },
              "cac:PartyName": {
                "cbc:Name": `${this.tenant.nombre}`, // Nombre comercial del emisor
              },
            },
            "cac:DigitalSignatureAttachment": {
              "cac:ExternalReference": {
                "cbc:URI": "#SignatureSP", // URI de la firma
              },
            },
          },
          "cac:AccountingSupplierParty": {
            "cac:Party": {
              "cac:PartyIdentification": {
                "cbc:ID": {
                  "@_schemeID": "6",
                  "@_schemeName": "Documento de Identidad",
                  "@_schemeAgencyName": "PE:SUNAT",
                  "@_schemeURI":
                    "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                  "#text": this.tenant.ruc,
                },
              },
              "cac:PartyName": {
                "cbc:Name": this.tenant.nombre,
              },
              "cac:PartyTaxScheme": {
                "cbc:RegistrationName": this.tenant.nombre,
                "cbc:CompanyID": {
                  "@_schemeID": "6",
                  "@_schemeName":
                    "SUNAT:Identificador de Documento de Identidad",
                  "@_schemeAgencyName": "PE:SUNAT",
                  "@_schemeURI":
                    "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                  "#text": this.tenant.ruc,
                },
                "cac:TaxScheme": {
                  "cbc:ID": {
                    "@_schemeID": "6",
                    "@_schemeName":
                      "SUNAT:Identificador de Documento de Identidad",
                    "@_schemeAgencyName": "PE:SUNAT",
                    "@_schemeURI":
                      "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                    "#text": this.tenant.ruc,
                  },
                },
              },
              "cac:PartyLegalEntity": {
                "cbc:RegistrationName": `${this.tenant.nombre}`,
                "cac:RegistrationAddress": {
                  "cbc:ID": {
                    "@_schemeName": "Ubigeos",
                    "@_schemeAgencyName": "PE:INEI",
                    "#text": "150137", //this.tenant.ubigeo,
                  },
                  "cbc:AddressTypeCode": {
                    "@_listAgencyName": "PE:SUNAT",
                    "@_listName": "Establecimientos anexos",
                    "#text": "0000",
                  },
                  "cbc:CityName": `LIMA`,
                  "cbc:CountrySubentity": `LIMA`,
                  "cbc:District": `SANTA ANITA`,
                  "cac:AddressLine": {
                    "cbc:Line": `BELISARIO SUAREZ SANTA ANITA - LIMA - LIMA`,
                  },
                  "cac:Country": {
                    "cbc:IdentificationCode": {
                      "@_listID": "ISO 3166-1",
                      "@_listAgencyName":
                        "United Nations Economic Commission for Europe",
                      "@_listName": "Country",
                      "#text": "PE",
                    },
                  },
                },
              },
              "cac:Contact": {
                "cbc:Name": `Nombre de Contacto`, // Asegúrate de que este campo no esté vacío
              },
            },
          },
          "cac:AccountingCustomerParty": {
            "cac:Party": {
              "cac:PartyIdentification": {
                "cbc:ID": {
                  "@_schemeID": this.venta.entidadClienteVenta.TipoEntidadId, //this.venta.entidadClienteVenta.TipoEntidadId, //tipo de documento del cliente
                  "@_schemeName":
                    this.venta.entidadClienteVenta.TipoEntidadId == 1
                      ? "Documento de Identidad"
                      : "SUNAT:Identificador de Documento de Identidad",
                  "@_schemeAgencyName": "PE:SUNAT",
                  "@_schemeURI":
                    "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                  "#text": this.venta.entidadClienteVenta.documento,
                },
              },
              "cac:PartyName": {
                "cbc:Name": `${this.venta.entidadClienteVenta.nombre} ${this.venta.entidadClienteVenta.apellido}`,
              },
              "cac:PartyTaxScheme": {
                "cbc:RegistrationName": `<![CDATA[${this.venta.entidadClienteVenta.nombre} ${this.venta.entidadClienteVenta.apellido}]]>`,
                "cbc:CompanyID": {
                  "@_schemeID": this.venta.entidadClienteVenta.TipoEntidadId,
                  "@_schemeName":
                    "SUNAT:Identificador de Documento de Identidad",
                  "@_schemeAgencyName": "PE:SUNAT",
                  "@_schemeURI":
                    "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                  "#text": this.venta.entidadClienteVenta.documento,
                },
                "cac:TaxScheme": {
                  "cbc:ID": {
                    "@_schemeID": this.venta.entidadClienteVenta.TipoEntidadId,
                    "@_schemeName":
                      "SUNAT:Identificador de Documento de Identidad",
                    "@_schemeAgencyName": "PE:SUNAT",
                    "@_schemeURI":
                      "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo06",
                    "#text": this.venta.entidadClienteVenta.documento,
                  },
                },
              },
              "cac:PartyLegalEntity": {
                "cbc:RegistrationName": `${this.venta.entidadClienteVenta.nombre} ${this.venta.entidadClienteVenta.apellido}`,
                "cac:RegistrationAddress": {
                  "cbc:ID": {
                    "@_schemeName": "Ubigeos",
                    "@_schemeAgencyName": "PE:INEI",
                  },
                  "cbc:CityName": ` `,
                  "cbc:CountrySubentity": ` `,
                  "cbc:District": ` `,
                  "cac:AddressLine": {
                    "cbc:Line": `${this.venta.entidadClienteVenta.direccion}`,
                  },
                  "cac:Country": {
                    "cbc:IdentificationCode": {
                      "@_listID": "ISO 3166-1",
                      "@_listAgencyName":
                        "United Nations Economic Commission for Europe",
                      "@_listName": "Country",
                    },
                  },
                },
              },
            },
          },
          "cac:PaymentTerms": {
            "cbc:ID": "FormaPago",
            "cbc:PaymentMeansID": "Contado",
          },
          "cac:TaxTotal": {
            "cbc:TaxAmount": {
              "@_currencyID": "PEN",
              "#text": this.venta.impuesto,
            },
            "cac:TaxSubtotal": {
              "cbc:TaxableAmount": {
                "@_currencyID": "PEN",
                "#text": this.venta.gravada,
              },
              "cbc:TaxAmount": {
                "@_currencyID": "PEN",
                "#text": this.venta.impuesto,
              },
              "cac:TaxCategory": {
                "cbc:ID": {
                  "@_schemeID": "UN/ECE 5305",
                  "@_schemeName": "Tax Category Identifier",
                  "@_schemeAgencyName":
                    "United Nations Economic Commission for Europe",
                  "#text": "S",
                },
                "cac:TaxScheme": {
                  "cbc:ID": {
                    "@_schemeID": "UN/ECE 5153",
                    "@_schemeAgencyID": "6",
                    "#text": "1000", //esto nose que es xd
                  },
                  "cbc:Name": "IGV",
                  "cbc:TaxTypeCode": "VAT",
                },
              },
            },
          },
          "cac:LegalMonetaryTotal": {
            "cbc:LineExtensionAmount": {
              "@_currencyID": "PEN",
              "#text": this.venta.gravada,
            },
            "cbc:TaxInclusiveAmount": {
              "@_currencyID": "PEN",
              "#text": this.venta.total,
            },
            "cbc:PayableAmount": {
              "@_currencyID": "PEN",
              "#text": this.venta.total,
            },
          },
          "cac:InvoiceLine": (this.venta.detalleventa || []).map(
            (item, index) => ({
              "cbc:ID": index + 1, //posible revienta
              "cbc:InvoicedQuantity": {
                "@_unitCode": "NIU",
                "@_unitCodeListID": "UN/ECE rec 20",
                "@_unitCodeListAgencyName":
                  "United Nations Economic Commission for Europe",
                "#text": item.cantidad,
              },
              "cbc:LineExtensionAmount": {
                "@_currencyID": "PEN",
                "#text": item.precio_bruto,
              },
              "cac:PricingReference": {
                "cac:AlternativeConditionPrice": {
                  "cbc:PriceAmount": {
                    "@_currencyID": "PEN",
                    "#text": item.precio_neto,
                  },
                  "cbc:PriceTypeCode": {
                    listName: "Tipo de Precio",
                    listAgencyName: "PE:SUNAT",
                    listURI:
                      "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo16",
                    "#text": "01",
                  }, // Precio unitario
                },
              },
              "cac:TaxTotal": {
                "cbc:TaxAmount": {
                  "@_currencyID": "PEN",
                  "#text": this.venta.impuesto,
                },
                "cac:TaxSubtotal": {
                  "cbc:TaxableAmount": {
                    "@_currencyID": "PEN",
                    "#text": item.gravada,
                  },
                  "cbc:TaxAmount": {
                    "@_currencyID": "PEN",
                    "#text": item.impuesto,
                  },
                  "cac:TaxCategory": {
                    "cbc:ID": {
                      "@_schemeID": "UN/ECE 5305",
                      "@_schemeName": "Tax Category Identifier",
                      "@_schemeAgencyName":
                        "United Nations Economic Commission for Europe",
                      "#text": "S",
                    },
                    "cbc:Percent": "18",
                    "cbc:TaxExemptionReasonCode": {
                      "@_listAgencyName": "PE:SUNAT",
                      "@_listName": "Afectacion del IGV",
                      "@_listURI":
                        "urn:pe:gob:sunat:cpe:see:gem:catalogos:catalogo07",
                      "#text": "10", //nose que es
                    },
                    "cac:TaxScheme": {
                      "cbc:ID": {
                        "@_schemeID": "UN/ECE 5153",
                        "@_schemeName": "Codigo de tributos",
                        "@_schemeAgencyName": "PE:SUNAT",
                        "#text": "1000", //nose que es
                      },
                      "cbc:Name": "IGV",
                      "cbc:TaxTypeCode": "VAT",
                    },
                  },
                },
              },
              "cac:Item": {
                "cbc:Description": `producto`,
              },
              "cac:Price": {
                "cbc:PriceAmount": {
                  "@_currencyID": "PEN",
                  "#text": item.gravada,
                },
              },
            })
          ),
          /*
          "cac:UBLExtensions": {
            "cac:UBLExtension": {
              "cbc:ExtensionContent": {
                "cbc:AdditionalInformation": (venta.Leyendas || []).map(
                  (leyenda) => ({
                    "cbc:AdditionalMonetaryTotal": {
                      "cbc:ID": leyenda.codigo,
                      "cbc:PayableAmount": {
                        "@_currencyID": "PEN",
                        "#text": 280,
                      },
                    },
                  })
                ),
              },
            },
          },
          */
        },
      };

      const builder = new XMLBuilder(options);
      const xml = builder.build(xmlData);

      // Guardar XML
      fs.writeFileSync(this.rutaXML, xml);
    } catch (error) {
      console.error("Error al generar el XML:", error);
      res
        .status(500)
        .json({ error: "Error al generar XML", details: error.message });
    }
  }
  async firmarXML() {
    try {
      console.log("-------------------FIRMANDO XML--------------------");
      console.log(`Ruta del XML: ${this.rutaXML}`);

      const certificadoPath = path.join(
        __dirname,
        "../../public/certificados/CERTIFICADO-DEMO-20612588598.pfx"
      );

      const xmlContent = fs.readFileSync(path.resolve(this.rutaXML), "utf8");
      const privateKeyPath = path.join(
        __dirname,
        "../../public/certificados/CERTIFICADO-DEMO-20612588598.pem"
      );
      const publicCertPath = path.join(
        __dirname,
        "../../public/certificados/CERTIFICADO-DEMO-20612588598-public.pem"
      );

      const privateKey = fs.readFileSync(privateKeyPath);
      const publicCert = fs.readFileSync(publicCertPath, "utf8");

      const signedXml = new SignedXml({
        privateKey: privateKey,

        publicCert: privateKey,
        //publicCert: certificate, // Opcional
        signatureAlgorithm: "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256",
        canonicalizationAlgorithm: "http://www.w3.org/2001/10/xml-exc-c14n#",
      });
      signedXml.addReference({
        xpath: "//*[local-name(.)='Invoice']",
        digestAlgorithm: "http://www.w3.org/2001/04/xmlenc#sha256",
        transforms: ["http://www.w3.org/2000/09/xmldsig#enveloped-signature"],
      });
      signedXml.canonicalizationAlgorithm =
        "http://www.w3.org/2001/10/xml-exc-c14n#";
      signedXml.signatureAlgorithm =
        "http://www.w3.org/2001/04/xmldsig-more#rsa-sha256";
      signedXml.computeSignature(xmlContent, {
        prefix: "ds",
        location: {
          reference: "//*[local-name(.)='ExtensionContent']",
          action: "append",
        },
      });
      //signedXml.getKeyInfoContent();
      fs.writeFileSync(path.resolve(this.rutaXML), signedXml.getSignedXml());
      console.log("XML firmado correctamente.");
    } catch (error) {
      console.error("Error firmando el XML:", error);
    }
  }

  async comprimiXML() {
    try {
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      console.log("-----------------COMPRIMIENDO XML------------------");
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      const nombreZIP = path.basename(this.rutaXML).replace(".xml", ".zip");
      const zipFile = new zip();

      // Comprimir el XML
      zipFile.addLocalFile(path.resolve(this.rutaXML));
      const zipPath = path.join(
        __dirname,
        "../../public/documents/zip/",
        nombreZIP
      );
      zipFile.writeZip(zipPath);
    } catch (error) {
      console.error("Error al comprimir el XML:", error);
      res.status(500).json({ error: "Error al comprimir el XML" });
    }
  }
  async sendXML() {
    try {
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      console.log("---------------ENVIANDO XML A SUNAT----------------");
      console.log("---------------------------------------------------");
      console.log("---------------------------------------------------");
      const zipPath = path.resolve(
        __dirname,
        "../../public/documents/zip/",
        `${this.nombreXML}.zip`
      );
      let zipContent;

      if (fs.existsSync(zipPath)) {
        zipContent = fs.readFileSync(zipPath).toString("base64");

        // Verificar la integridad del archivo ZIP
        const hash = crypto.createHash("sha256");
        hash.update(fs.readFileSync(zipPath));
        const digestBase64 = hash.digest("base64"); // Cambia a base64
        console.log("Digest en base64 del archivo ZIP:", digestBase64);
      } else {
        console.error("El archivo no existe:", zipPath);
      }

      const xmlEnvio = `<soapenv:Envelope xmlns:soapenv="http://schemas.xmlsoap.org/soap/envelope/" xmlns:ser="http://service.sunat.gob.pe" xmlns:wsse="http://docs.oasis-open.org/wss/2004/01/oasis-200401-wss-wssecurity-secext-1.0.xsd">
              <soapenv:Header>
                  <wsse:Security>
                      <wsse:UsernameToken>
                          <wsse:Username>${this.tenant.ruc}${this.tenant.nombre}</wsse:Username>
                          <wsse:Password>${this.tenant.claveCertificado}</wsse:Password>
                      </wsse:UsernameToken>
                  </wsse:Security>
              </soapenv:Header>
              <soapenv:Body>
                  <ser:sendBill>
                      <fileName>${this.nombreXML}.zip</fileName>
                      <contentFile>${zipContent}</contentFile>
                  </ser:sendBill>
              </soapenv:Body>
          </soapenv:Envelope>`;
      const response = await axios.post(
        "https://e-beta.sunat.gob.pe/ol-ti-itcpfegem-beta/billService",
        xmlEnvio,
        {
          headers: {
            "Content-Type": "text/xml; charset=utf-8",
            Accept: "text/xml",
            "Cache-Control": "no-cache",
            Pragma: "no-cache",
            SOAPAction: "",
            "Content-Length": xmlEnvio.length,
          },
        }
      );

      // Manejar la respuesta
      return response.data;
    } catch (error) {
      console.error(
        "Error al enviar a SUNAT:",
        error.response ? error.response.data : error.message
      );
    }
  }
}

module.exports = Sunat;
