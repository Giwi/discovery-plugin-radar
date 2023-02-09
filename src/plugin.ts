import {PluginDef, PluginManager} from "@senx/discovery-widgets";
import * as pack from "../package.json"

export default () => {
  PluginManager.getInstance().register(new PluginDef({
    type: 'radar',                                                                    
    name: pack.name,
    tag: 'discovery-plugin-radar',
    author: pack.author,
    description: pack.description,
    version: pack.version,
  }));
}